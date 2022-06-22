(ns oph.common.server
  (:use [org.httpkit.server :only [run-server]])
  (:require [clojure.tools.logging :as log]
            [ring.middleware.conditional :refer [if-url-doesnt-match]]
            [ring.middleware.logger :refer [wrap-with-logger]]
            [ring.middleware.ssl :refer [wrap-hsts]]
            [ring.util.response :refer [get-header header]]
            [oph.soresu.common.config :refer [config]]
            [oph.va.jdbc.extensions])
  (:import (java.net Socket)
           (java.io IOException)))

(defn- fail-if-server-running [host port]
  (try
    (let [socket (Socket. host port)]
      (.close socket)
      (throw (Exception. (format "Server is already running %s:%d" host port))))
    (catch IOException e)))

(defn start-server [{:keys [host port auto-reload? routes on-startup on-shutdown threads attachment-max-size]}]
  (fail-if-server-running host port)
  (on-startup)
  (log/info (format "Starting server in URL http://%s:%d/" host port))
  (let [max-body           (* attachment-max-size 1024 1024)
        stop               (run-server routes {:host host
                                               :port port
                                               :thread threads
                                               :max-body max-body})
        shutdown-done?     (atom false)
        check-and-shutdown (fn []
                             (if (compare-and-set! shutdown-done? false true)
                               (on-shutdown)))]
    ;; Return stop-function with our own shutdown
    (fn []
      (stop)
      (check-and-shutdown))))

(defn wrap-logger [handler]
  (if (-> config :server :enable-access-log?)
    (if-url-doesnt-match handler #"/api/healthcheck" wrap-with-logger)
    handler))

(defn wrap-hsts-when-enabled [handler]
  (if (-> config :server :enable-hsts?)
    (wrap-hsts handler)
    handler))

(defn wrap-cache-control [handler]
  (fn [request]
    (let [response (handler request)
          response-cache-validated? (or (get-header response "Last-Modified")
                                        (get-header response "ETag"))]
      (-> response
        (header "Expires" 0)
        (header "Cache-Control" (if response-cache-validated?
                                  "no-cache, must-revalidate, max-age=0"
                                  "no-store, max-age=0"))))))

(defn wrap-csp-when-enabled [handler default-src connect-src]
  (if (-> config :server :enable-csp?)
    (fn [request]
      (let [response (handler request)
            is-swagger-ui (= (:uri request) "/doc/index.html")]
        (-> response
          (header "Content-Security-Policy"
            (if is-swagger-ui
              (str "default-src 'self' " default-src "; style-src * 'unsafe-inline'; img-src 'self' validator.swagger.io data:; script-src " default-src " 'unsafe-inline'")
              (str "default-src 'self' " default-src "; connect-src " default-src " " connect-src "; object-src 'none'; font-src *; style-src * 'unsafe-inline'; style-src-attr * 'unsafe-inline'; style-src-elem * 'unsafe-inline'; img-src * data:; report-uri /api/healthcheck/csp-report"))))))
    handler))
