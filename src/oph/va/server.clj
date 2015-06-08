(ns oph.va.server
  (:use [org.httpkit.server :only [run-server]]
        [oph.va.routes :only [all-routes]])
  (:require [ring.middleware.reload :as reload]
            [compojure.handler :refer [site]]
            [clojure.tools.logging :as log]
            [oph.va.config :refer [config]]
            [oph.va.db :as db]
            [oph.va.db.migrations :as dbmigrations])
  (:gen-class)
  (:import (java.net Socket)
           (java.io IOException)))

(defn fail-if-server-running [host port]
  (try
    (let [socket (Socket. host port)]
      (do (.close socket) (throw (Exception. (format "Server is already running %s:%d" host port)))))
    (catch IOException e)))

(defn start-server [host port auto-reload?]
  (let [handler (if auto-reload?
                  (reload/wrap-reload (site #'all-routes))
                  (site all-routes))]
    (fail-if-server-running host port)
    (log/info "Running db migrations")
    (dbmigrations/migrate)
    (log/info (format "Starting server in URL http://%s:%d/" host port))
    (try (run-server handler {:host host :port port})
         (finally
           (db/close-datasource!)))))

(defn -main [& args]
  (let [server-config (:server config)
        auto-reload? (:auto-reload? server-config)
        port (:port server-config)
        host (:host server-config)]
    (start-server host port auto-reload?)))
