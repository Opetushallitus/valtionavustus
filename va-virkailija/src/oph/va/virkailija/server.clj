(ns oph.va.virkailija.server
  (:use [clojure.tools.trace :only [trace]]
        [oph.va.virkailija.routes :only [all-routes]])
  (:require [ring.middleware.reload :as reload]
            [ring.middleware.logger :as logger]
            [ring.middleware.session :as session]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [ring.middleware.conditional :refer [if-url-doesnt-match]]
            [ring.middleware.defaults :refer :all]
            [buddy.auth :refer [authenticated?]]
            [buddy.auth.middleware :refer [wrap-authentication]]
            [buddy.auth.accessrules :refer [wrap-access-rules success error]]
            [buddy.auth.backends.session :refer [session-backend]]
            [clojure.tools.logging :as log]
            [oph.common.server :as server]
            [oph.common.config :refer [config]]
            [oph.common.db :as db]
            [oph.va.virkailija.auth :as auth]
            [oph.va.virkailija.db.migrations :as dbmigrations]))

(defn- startup [config]
  (log/info "Using configuration: " config)
  (log/info "Running db migrations")
  (dbmigrations/migrate :db "db.migration"))

(defn- shutdown []
  (log/info "Shutting down all services")
  (db/close-datasource! :db))

(defn- with-log-wrapping [site]
  (if (-> config :server :enable-access-log?)
    (if-url-doesnt-match site #"/api/healthcheck" logger/wrap-with-logger)
    site))

(def backend (session-backend))

(defn any-access [request] true)

(defn authenticated-access [request]
  (if (auth/check-identity (-> request :session :identity))
    true
    (error "Authentication required")))

(def rules [{:pattern #"^/login$"
             :handler any-access}
            {:pattern #"^/js/.*"
             :handler any-access}
            {:pattern #"^/img/.*"
             :handler any-access}
            {:pattern #"^/css/.*"
             :handler any-access}
            {:pattern #"^/.*"
             :handler authenticated-access
             :redirect "/login"}])

(defn- with-authentication [site]
  (-> site
      (wrap-authentication backend)
      (wrap-access-rules {:rules rules})))

(defn start-server [host port auto-reload?]
  (let [cookie-defaults {:max-age 60000
                         :http-only false}
        defaults (-> site-defaults
                     (assoc-in [:security :anti-forgery] false)
                     (assoc :session {:store (cookie-store {:key (-> config
                                                                     :server
                                                                     :cookie-key)})
                                      :cookie-name "identity"
                                      :cookie-attrs (if (-> config
                                                            :server
                                                            :require-https?)
                                                      (assoc cookie-defaults :secure true)
                                                      cookie-defaults)}))
        routes (-> #'all-routes
                   (with-authentication)
                   (wrap-defaults defaults)
                   (with-log-wrapping))
        handler (if auto-reload?
                  (reload/wrap-reload routes)
                  routes)]
    (server/start-server {:host host
                          :port port
                          :auto-reload? auto-reload?
                          :routes handler
                          :on-startup (partial startup config)
                          :on-shutdown shutdown})))
