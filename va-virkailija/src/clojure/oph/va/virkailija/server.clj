(ns oph.va.virkailija.server
  (:require [ring.middleware.reload :refer [wrap-reload]]
            [ring.middleware.session.cookie :refer [cookie-store]]
            [ring.middleware.not-modified :refer [wrap-not-modified]]
            [ring.middleware.session-timeout :as ring-session-timeout]
            [ring.middleware.defaults :refer [site-defaults wrap-defaults]]
            [buddy.auth.middleware :as buddy-middleware]
            [buddy.auth.accessrules :as buddy-accessrules]
            [oph.va.virkailija.db.migrations :as dbmigrations]
            [buddy.auth.backends.session :as buddy-session]
            [clojure.tools.logging :as log]
            [oph.common.server :as server]
            [oph.common.background-job-supervisor :as job-supervisor]
            [oph.soresu.common.config :refer [config environment]]
            [oph.soresu.common.db :as db]
            [oph.va.virkailija.authentication :as auth]
            [oph.va.virkailija.email :as email]
            [oph.va.virkailija.va-users :as va-users]
            [oph.va.virkailija.notification-scheduler :as notification-scheduler]
            [oph.va.virkailija.rondo-scheduling :as rondo-scheduling]
            [oph.va.virkailija.routes :refer [all-routes opintopolku-login-url virkailija-login-url]]
            [oph.va.virkailija.healthcheck :as healthcheck]
            [oph.va.virkailija.tasmaytysraportti :as tasmaytysraportti]))

(defn- startup [config]
  (log/info "Startup, with configuration: " config)
  (dbmigrations/migrate "virkailija"
                        "db.migration.virkailija"
                        "oph.va.virkailija.db.migrations")
  (email/start-background-job-send-mails)
  (auth/start-background-job-timeout-sessions)
  (when (get-in config [:va-users :use-cache?])
    (va-users/start-background-job-update-va-users-cache))
  (when (get-in config [:rondo-scheduler :enabled?])
    (rondo-scheduling/schedule-fetch-from-rondo))
  (notification-scheduler/start-notification-scheduler)
  (when (get-in config [:integration-healthcheck :enabled?])
    (log/info "Starting scheduled healthcheck")
    (healthcheck/start-schedule-status-update!))
  (when (get-in config [:tasmaytysraportti-create :enabled?])
    (tasmaytysraportti/start-schedule-create-tasmaytysraportti))
  (when (get-in config [:tasmaytysraportti-send :enabled?])
    (tasmaytysraportti/start-schedule-send-tasmaytysraportti))
  (when (get-in config [:email :persistent-retry :enabled? ])
    (email/start-persistent-retry-job)))

(defn- shutdown []
  (log/info "Shutting down...")
  (email/stop-background-job-send-mails)
  (auth/stop-background-job-timeout-sessions)
  (if (get-in config [:va-users :use-cache?])
    (va-users/stop-background-job-update-va-users-cache))
  (db/close-datasource!)
  (job-supervisor/await-jobs!)
  (rondo-scheduling/stop-schedule-from-rondo)
  (notification-scheduler/stop-notification-scheduler)
  (when (get-in config [:integration-healthcheck :enabled?])
    (healthcheck/stop-schedule-status-update!))
  (when (get-in config [:tasmaytysraportti-create :enabled?])
    (tasmaytysraportti/stop-schedule-create-tasmaytysraportti))
  (when (get-in config [:tasmaytysraportti-send :enabled?])
    (tasmaytysraportti/stop-schedule-send-tasmaytysraportti))
  (when (get-in config [:email :persistent-retry :enabled? ])
    (email/stop-persistent-retry-job)))

(defn- query-string-for-redirect-location [original-request]
  (if-let [original-query-string (:query-string original-request)]
    (str "?" original-query-string)))

(defn- redirect-to-login [request]
  (let [original-url (str (:uri request) (query-string-for-redirect-location request))
        return-url virkailija-login-url]
    {:status  302
     :headers {"Location" (str opintopolku-login-url return-url)
               "Content-Type" "text/plain"}
     :body    (str "Access to " (:uri request) " is not authorized, redirecting to login")
     :session {:original-url original-url}}))

(defn- any-access [_] true)

(defn- authenticated-access [request]
  (if (auth/get-request-identity request)
    true
    (buddy-accessrules/error "Authentication required")))

(defn- with-authentication [site]
  (-> site
      (buddy-middleware/wrap-authentication (buddy-session/session-backend))
      (buddy-accessrules/wrap-access-rules
       {:rules [{:pattern #"^/virkailija/login.*$"
                 :handler any-access}
                {:pattern #"^/login/.*$"
                 :handler any-access}
                {:pattern #"^/environment"
                 :handler any-access}
                {:pattern #"^/errorlogger"
                 :handler any-access}
                {:pattern #"^/virkailija/js/.*"
                 :handler any-access}
                {:pattern #"^/virkailija/img/.*"
                 :handler any-access}
                {:pattern #"^/virkailija/css/.*"
                 :handler any-access}
                {:pattern #"^/api/healthcheck"
                 :handler any-access}
                {:pattern #"^/public/.*"
                 :handler any-access}
                {:pattern #"^/favicon.ico"
                 :handler any-access}
                {:pattern #"^/api/v2/external/.*"
                 :handler any-access}
                {:pattern #".*"
                 :handler authenticated-access
                 :on-error (fn [request _]
                             (redirect-to-login request))}]})))

(defn- without-authentication [site]
  (when (not (or (= environment "dev") (= environment "test")))
    (throw (Exception.
             "Authentication is allowed only in dev or test environments")))
  (-> site
      (buddy-middleware/wrap-authentication (buddy-session/session-backend))
      (buddy-accessrules/wrap-access-rules
       {:rules [{:pattern #".*"
                 :handler any-access
                 :on-error (fn [request _]
                             (redirect-to-login request))}]})))

(defn start-server [{:keys [host port auto-reload? without-authentication?]}]
   (let [defaults (-> site-defaults
                      (assoc-in [:security :anti-forgery] false)
                      (assoc-in [:session :store]
                                (cookie-store
                                  {:key (-> config :server :cookie-key)}))
                      (assoc-in [:session :cookie-name] "va")
                      (assoc-in [:session :cookie-attrs :max-age]
                                (-> config :server :session-timeout-in-s))
                      (assoc-in [:session :cookie-attrs :same-site] :lax) ; required for CAS initiated redirection
                      (assoc-in [:session :cookie-attrs :secure]
                                (-> config :server :require-https?)))
         authenticator (if without-authentication?
                         without-authentication
                         with-authentication)
         hakija-url (clojure.string/join "" (drop-last (-> config :server :url :fi)))
         handler (as-> #'all-routes h
                   (authenticator h)
                   (ring-session-timeout/wrap-absolute-session-timeout
                     h {:timeout (-> config :server :session-timeout-in-s)
                        :timeout-handler redirect-to-login})
                   (wrap-defaults h defaults)
                   (server/wrap-logger h)
                   (server/wrap-cache-control h)
                   (server/wrap-csp-when-enabled h (-> config :server :virkailija-url) hakija-url)
                   (server/wrap-hsts-when-enabled h)
                   (wrap-not-modified h)
                   (if auto-reload?
                     (wrap-reload h {:dirs ["va-virkailija/src" "soresu-form/src"]})
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
