(ns oph.va.virkailija.server
  (:use [clojure.tools.trace :only [trace]]
        [oph.va.virkailija.routes :only [all-routes opintopolku-login-url virkailija-login-url]])
  (:require [ring.middleware.reload :refer [wrap-reload]]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [ring.middleware.not-modified :refer [wrap-not-modified]]
            [ring.middleware.defaults :refer :all]
            [buddy.auth :refer [authenticated?]]
            [buddy.auth.middleware :refer [wrap-authentication]]
            [buddy.auth.accessrules :refer [wrap-access-rules error]]
            [buddy.auth.backends.session :refer [session-backend]]
            [clojure.tools.logging :as log]
            [oph.common.server :as server]
            [oph.soresu.common.config :refer [config]]
            [oph.soresu.common.db :as db]
            [oph.va.virkailija.authentication :as auth]
            [oph.va.virkailija.db.migrations :as dbmigrations]
            [oph.va.virkailija.email :as email]))

(defn- startup [config]
  (log/info "Using configuration: " config)
  (log/info "Running db migrations")
  (dbmigrations/migrate :virkailija-db
                        "db.migration"
                        "oph.va.virkailija.db.migrations")
  (log/info "Starting e-mail sender")
  (email/start-background-sender))

(defn- shutdown []
  (log/info "Shutting down all services")
  (email/stop-background-sender)
  (db/close-datasource! :virkailija-db))

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
            {:pattern #"^/errorlogger"
             :handler any-access}
            {:pattern #"^/js/.*"
             :handler any-access}
            {:pattern #"^/img/.*"
             :handler any-access}
            {:pattern #"^/css/.*"
             :handler any-access}
            {:pattern #"^/api/healthcheck"
             :handler any-access}
            {:pattern #"^/public/.*"
             :handler any-access}
            {:pattern #"^/favicon.ico"
             :handler any-access}
            {:pattern #".*"
             :handler authenticated-access
             :on-error redirect-to-login}])

(defn wrap-with-local-cors [handler url]
  (fn [request]
    (let [response (handler request)]
      (-> response
          (assoc-in [:headers "Access-Control-Allow-Origin"] url)
          (assoc-in [:headers "Access-Control-Allow-Credentials"] true)))))

(defn- with-authentication [site]
  (-> site
      (wrap-authentication backend)
      (wrap-access-rules {:rules rules})))

(defn start-server [host port auto-reload?]
  (let [defaults (-> site-defaults
                     (assoc-in [:security :anti-forgery] false)
                     (assoc-in [:session :store] (cookie-store {:key (-> config :server :cookie-key)}))
                     (assoc-in [:session :cookie-name] "identity")
                     (assoc-in [:session :cookie-attrs :max-age] 60000)
                     (assoc-in [:session :cookie-attrs :same-site] :lax)  ; required for CAS initiated redirection
                     (assoc-in [:session :cookie-attrs :secure] (-> config :server :require-https?)))
        handler (as-> #'all-routes h
                  (with-authentication h)
                  (wrap-defaults h defaults)
                  (server/wrap-logger h)
                  (server/wrap-cache-control h)
                  (wrap-not-modified h)
                  (if-let [local-url (get-in config [:server :local-front-url])]
                    (wrap-with-local-cors h local-url)
                    h)
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
