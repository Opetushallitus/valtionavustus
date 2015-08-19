(ns oph.va.server
  (:use [org.httpkit.server :only [run-server]]
        [oph.va.routes :only [all-routes restricted-routes]])
  (:require [ring.middleware.reload :as reload]
            [ring.middleware.logger :as logger]
            [ring.middleware.conditional :refer [if-url-doesnt-match]]
            [compojure.handler :refer [site]]
            [clojure.tools.logging :as log]
            [oph.common.config :refer [config]]
            [oph.common.db :as db]
            [oph.va.db.migrations :as dbmigrations]
            [oph.va.email :as email])
  (:gen-class)
  (:import (java.net Socket)
           (java.io IOException)))

(defn fail-if-server-running [host port]
  (try
    (let [socket (Socket. host port)]
      (do (.close socket) (throw (Exception. (format "Server is already running %s:%d" host port)))))
    (catch IOException e)))

(defn- shutdown []
  (log/info "Shutting down all services")
  (email/stop-background-sender)
  (db/close-datasource!))

(defn start-server [host port auto-reload?]
  (let [site (site (if (-> config :api :restricted-routes?)
                     #'restricted-routes
                     (do
                       (log/warn "Enabling all routes. This setting should be used only in development!")
                       #'all-routes)))
        logged (-> site
                   (if-url-doesnt-match #"/img/favicon.png" logger/wrap-with-logger))
        handler (if auto-reload?
                  (reload/wrap-reload logged)
                  logged)]
    (fail-if-server-running host port)
    (log/info "Using configuration: " config)
    (log/info "Running db migrations")
    (dbmigrations/migrate)
    (log/info "Starting e-mail sender")
    (email/start-background-sender)
    (log/info (format "Starting server in URL http://%s:%d/" host port))
    (let [stop (run-server handler {:host host :port port})]
      (.addShutdownHook (Runtime/getRuntime) (Thread. shutdown))
      ;; Return stop-function with our own shutdown
      (fn []
        (stop)
        (shutdown)))))

(defn -main [& args]
  (let [server-config (:server config)
        auto-reload? (:auto-reload? server-config)
        port (:port server-config)
        host (:host server-config)]
    (start-server host port auto-reload?)))
