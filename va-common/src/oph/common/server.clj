(ns oph.common.server
  (:use [org.httpkit.server :only [run-server]])
  (:require [clojure.tools.logging :as log]
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
  (let [max-body (* attachment-max-size 1024 1024)
        stop (run-server routes {:host host
                                 :port port
                                 :thread threads
                                 :max-body max-body})]
    (.addShutdownHook (Runtime/getRuntime) (Thread. on-shutdown))
    ;; Return stop-function with our own shutdown
    (fn []
      (stop)
      (on-shutdown))))

(defn wrap-nocache [handler]
  (fn [request]
     (let [response (handler request)]
       (-> response
           (assoc-in [:headers "Pragma"] "no-cache")
           (assoc-in [:headers "Cache-Control"]  "no-cache, no-store, must-revalidate")
           (assoc-in [:headers "Expires"]  0)))))
