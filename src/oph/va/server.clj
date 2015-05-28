(ns oph.va.server
  (:use [org.httpkit.server :only [run-server]]
        [oph.va.routes :only [all-routes]])
  (:require [ring.middleware.reload :as reload]
            [compojure.handler :refer [site]]
            [clojure.tools.logging :as log]
            [oph.va.config :refer [config]]
            [oph.va.db.migrations :as dbmigrations])
  (:gen-class)
  (:import (java.net Socket)
           (java.io IOException)))

(defn fail-if-server-running [host port]
  (try
    (let [socket (Socket. host port)]
      (do (.close socket) (throw (Exception. (format "Server is allready running %s:%d" host port)))))
    (catch IOException e)))

(defn start-server [host port auto-reload?]
  (let [handler (if auto-reload?
                  (reload/wrap-reload (site #'all-routes))
                  (site all-routes))]
    (run-server handler {:host host :port port})))

(defn -main [& args]
  (let [auto-reload? (:auto-reload? config)
        port (:port config)
        host (:host config)]
    (fail-if-server-running host port)
    (log/info "Running db migrations")
    (dbmigrations/migrate)
    (log/info (format "Starting server in URL http://%s:%d/" host port))
    (start-server host port auto-reload?)))