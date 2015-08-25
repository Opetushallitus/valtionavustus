(ns oph.va.hakija.server
  (:use [oph.va.hakija.routes :only [all-routes restricted-routes]])
  (:require [ring.middleware.reload :as reload]
            [ring.middleware.logger :as logger]
            [ring.middleware.conditional :refer [if-url-doesnt-match]]
            [compojure.handler :refer [site]]
            [clojure.tools.logging :as log]
            [oph.common.server :as server]
            [oph.common.config :refer [config]]
            [oph.common.db :as db]
            [oph.va.hakija.db.migrations :as dbmigrations]
            [oph.va.hakija.email :as email]))

(defn- startup [config]
  (log/info "Using configuration: " config)
  (log/info "Running db migrations")
  (dbmigrations/migrate "db.migration")
  (log/info "Starting e-mail sender")
  (email/start-background-sender))

(defn- shutdown []
  (log/info "Shutting down all services")
  (email/stop-background-sender)
  (db/close-datasource!))

(defn- create-restricted-routes [] #'restricted-routes)
(defn- create-all-routes [] #'all-routes)

(defn- create-site []
  (site (if (-> config :api :restricted-routes?)
                       (create-restricted-routes)
                       (do
                         (log/warn "Enabling all routes. This setting should be used only in development!")
                         (create-all-routes)))))

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
