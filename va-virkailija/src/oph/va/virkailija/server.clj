(ns oph.va.virkailija.server
  (:use [clojure.tools.trace :only [trace]]
        [oph.va.virkailija.routes :only [all-routes opintopolku-login-url virkailija-login-url]])
  (:require [ring.middleware.reload :as reload]
            [ring.middleware.logger :as logger]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [ring.middleware.conditional :refer [if-url-doesnt-match]]
            [ring.middleware.defaults :refer :all]
            [buddy.auth :refer [authenticated?]]
            [buddy.auth.middleware :refer [wrap-authentication]]
            [buddy.auth.accessrules :refer [wrap-access-rules success error]]
            [buddy.auth.backends.session :refer [session-backend]]
            [clojure.tools.logging :as log]
            [oph.common.server :as server]
            [oph.soresu.common.config :refer [config]]
            [oph.soresu.common.db :as db]
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

(defn- query-string-for-redirect-location [original-request]
  (if-let [original-query-string (:query-string original-request)]
    (str "?" original-query-string)))

(defn- redirect-to-login [request response]
  (let [original-url (str (:uri request) (query-string-for-redirect-location request))
        return-url virkailija-login-url]
    {:status  302
     :headers {"Location" (str opintopolku-login-url return-url)
               "Content-Type" "text/plain"}
     :body    (str "Access to " (:uri request) " is not authorized, redirecting to login")
     :session {:original-url original-url}}))

(defn authenticated-access [request]
  (if (auth/check-identity (-> request :session :identity))
    true
    (error "Authentication required")))

(def rules [{:pattern #"^/login.*$"
             :handler any-access}
            {:pattern #"^/environment"
             :handler any-access}
            {:pattern #"^/js/.*"
             :handler any-access}
            {:pattern #"^/img/.*"
             :handler any-access}
            {:pattern #"^/css/.*"
             :handler any-access}
            {:pattern #".*"
             :handler authenticated-access
             :on-error redirect-to-login}])

(defn- with-authentication [site]
  (-> site
      (wrap-authentication backend)
      (wrap-access-rules {:rules rules})))

(defn start-server [host port auto-reload?]
  (let [cookie-defaults {:max-age 60000
                         :http-only false}
        cookie-attrs (if (-> config :server :require-https?)
                       (assoc cookie-defaults :secure true)
                       cookie-defaults)
        cookie-store (cookie-store {:key (-> config :server :cookie-key)})
        defaults (-> site-defaults
                     (assoc-in [:security :anti-forgery] false)
                     (assoc :session {:store cookie-store
                                      :cookie-name "identity"
                                      :cookie-attrs cookie-attrs}))
        routes (-> #'all-routes
                   (with-authentication)
                   (wrap-defaults defaults)
                   (with-log-wrapping)
                   (server/wrap-nocache))
        handler (if auto-reload?
                  (reload/wrap-reload routes)
                  routes)
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
