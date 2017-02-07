(ns oph.va.hakija.server
  (:use [oph.va.hakija.routes :only [all-routes restricted-routes]])
  (:require [ring.middleware.reload :refer [wrap-reload]]
            [ring.middleware.logger :as logger]
            [ring.middleware.conditional :refer [if-url-doesnt-match]]
            [ring.middleware.not-modified :refer [wrap-not-modified]]
            [ring.middleware.defaults :refer :all]
            [clojure.tools.logging :as log]
            [oph.common.server :as server]
            [oph.soresu.common.config :refer [config]]
            [oph.soresu.common.db :as db]
            [oph.va.hakija.db.migrations :as dbmigrations]
            [oph.va.hakija.email :as email]))

(defn- startup [config]
  (log/info "Using configuration: " config)
  (log/info "Running db migrations")
  (dbmigrations/migrate :form-db "db.migration" "oph.va.hakija.db.migrations")
  (log/info "Starting e-mail sender")
  (email/start-background-sender))

(defn- shutdown []
  (log/info "Shutting down all services")
  (email/stop-background-sender)
  (db/close-datasource! :form-db))

(defn- create-restricted-routes [] #'restricted-routes)
(defn- create-all-routes [] #'all-routes)

(defn- create-routes []
  (if (-> config :api :restricted-routes?)
    (create-restricted-routes)
    (do
      (log/warn "Enabling all routes. This setting should be used only in development!")
      (create-all-routes))))

(defn- create-site []
  (-> (create-routes)
      (wrap-defaults (-> site-defaults
                         (assoc-in [:security :anti-forgery] false)))))

(defn- with-log-wrapping [site]
  (if (-> config :server :enable-access-log?)
    (if-url-doesnt-match site #"/api/healthcheck" logger/wrap-with-logger)
    site))

(defn start-server [host port auto-reload?]
  (let [handler (as-> (create-site) h
                  (with-log-wrapping h)
                  (server/wrap-cache-control h)
                  (wrap-not-modified h)
                  (if auto-reload?
                    (wrap-reload h)
                    h))
        threads (or (-> config :server :threads) 16)
        attachment-max-size (or (-> config :server :attachment-max-size) 50)]
    (server/start-server {:host host
                          :port port
                          :auto-reload? auto-reload?
                          :routes handler
                          :on-startup (partial startup config)
                          :on-shutdown shutdown
                          :threads threads
                          :attachment-max-size attachment-max-size})))
