(ns oph.va.virkailija.server
  (:use [clojure.tools.trace :only [trace]]
        [oph.va.virkailija.routes :only [all-routes]])
  (:require [ring.middleware.reload :as reload]
            [ring.middleware.logger :as logger]
            [ring.middleware.session :as session]
            [ring.middleware.session.cookie :as cookie]
            [ring.middleware.conditional :refer [if-url-doesnt-match]]
            [buddy.auth :refer [authenticated?]]
            [buddy.auth.middleware :refer [wrap-authentication]]
            [buddy.auth.accessrules :refer [wrap-access-rules success error]]
            [buddy.auth.backends.session :refer [session-backend]]
            [compojure.handler :refer [site]]
            [clojure.tools.logging :as log]
            [oph.common.server :as server]
            [oph.common.config :refer [config]]
            [oph.common.db :as db]
            [oph.va.virkailija.db.migrations :as dbmigrations]))

(defn- startup [config]
  (log/info "Using configuration: " config)
  (log/info "Running db migrations")
  (dbmigrations/migrate :db "db.migration"))

(defn- shutdown []
  (log/info "Shutting down all services")
  (db/close-datasource! :db))

(defn- create-site [] (site #'all-routes))

(defn- with-log-wrapping [site]
  (if (-> config :server :enable-access-log?)
    (if-url-doesnt-match site #"/api/healthcheck" logger/wrap-with-logger)
    site))

(defn- with-session [site]
  (session/wrap-session site {:store (cookie/cookie-store {:key "a 16-byte secret"})
                              :cookie-attrs {:max-age 3600
                                             :secure true}}))

(def backend (session-backend))

(defn any-access [request] true)

(defn authenticated-access [request]
  (if (authenticated? request)
    true
    ;;(error "Authentication required")
    true))

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
  (let [logged (-> (create-site)
                   (with-log-wrapping)
                   (with-session)
                   (with-authentication))
        handler (if auto-reload?
                  (reload/wrap-reload logged)
                  logged)]
    (server/start-server {:host host
                          :port port
                          :auto-reload? auto-reload?
                          :routes handler
                          :on-startup (partial startup config)
                          :on-shutdown shutdown})))
