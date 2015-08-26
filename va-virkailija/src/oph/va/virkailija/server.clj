(ns oph.va.virkailija.server
  (:use [oph.va.virkailija.routes :only [all-routes]])
  (:require [ring.middleware.reload :as reload]
            [ring.middleware.logger :as logger]
            [ring.middleware.conditional :refer [if-url-doesnt-match]]
            [compojure.handler :refer [site]]
            [clojure.tools.logging :as log]
            [oph.common.server :as server]
            [oph.common.config :refer [config]]
            [oph.common.db :as db]
            [oph.va.virkailija.db.migrations :as dbmigrations]))

(defn- startup [config]
  (log/info "Using configuration: " config)
  (log/info "Running db migrations")
  (dbmigrations/migrate "db.migration"))

(defn- shutdown []
  (log/info "Shutting down all services")
  (db/close-datasource!))

(defn- create-site [] (site #'all-routes))

(defn- with-log-wrapping [site]
  (if (-> config :server :enable-access-log?)
                     (-> site
                         (if-url-doesnt-match #"/api/healthcheck" logger/wrap-with-logger))
                     site))

(defn start-server [host port auto-reload?]
  (let [logged (with-log-wrapping (create-site))
        handler (if auto-reload?
                  (reload/wrap-reload logged)
                  logged)]
    (server/start-server {:host host
                          :port port
                          :auto-reload? auto-reload?
                          :routes handler
                          :on-startup (partial startup config)
                          :on-shutdown shutdown})))
