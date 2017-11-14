(ns oph.va.virkailija.authentication
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.cas :as cas]
            [oph.va.virkailija.ldap :as ldap]
            [oph.common.background-job-supervisor :as job-supervisor]
            [clojure.core.async :refer [<! >!! alts! go chan timeout]]
            [clojure.tools.logging :as log])
  (:import (fi.vm.sade.utils.cas CasLogout)))

(def ^:private sessions (atom {}))

(def ^:private sessions-timeout-ms (-> config
                                       (get-in [:server :session_timeout_in_s])
                                       (+ 5)  ; ensure backend session timeout happens after browser session timeout
                                       (* 1000)))

(def ^:private sessions-timeout-chan (chan 1))

(defn- remove-timed-out-sessions [sessions]
  (let [now-time-ms (System/currentTimeMillis)]
    (reduce-kv (fn [acc cas-ticket session-data]
                 (let [timeout-at-ms (:timeout-at-ms session-data)]
                   (if (< timeout-at-ms now-time-ms)
                     acc
                     (assoc acc cas-ticket session-data))))
               {}
               sessions)))

(defn- start-loop-remove-timed-out-sessions []
  (go
    (log/info "Starting background job: sessions timeout...")
    (loop []
      (let [[value _] (alts! [sessions-timeout-chan (timeout 500)])]
        (if (nil? value)
          (do
            (swap! sessions remove-timed-out-sessions)
            (recur)))))
    (log/info "Stopped background job: sessions timeout.")))

(defn start-background-job-timeout-sessions []
  (job-supervisor/start-background-job :timeout-sessions
                                       start-loop-remove-timed-out-sessions
                                       #(>!! sessions-timeout-chan {:operation :stop})))

(defn stop-background-job-timeout-sessions []
  (job-supervisor/stop-background-job :timeout-sessions))

(defn- authenticate-and-authorize-va-user [cas-ticket virkailija-login-url]
  (if-let [username (cas/validate-service-ticket virkailija-login-url cas-ticket)]
    (ldap/check-app-access username)))

(defn authenticate [cas-ticket virkailija-login-url]
  (if-let [identity (authenticate-and-authorize-va-user cas-ticket virkailija-login-url)]
    (let [username (:username identity)]
      (swap! sessions assoc cas-ticket {:identity      identity
                                        :timeout-at-ms (+ sessions-timeout-ms (System/currentTimeMillis))})
      (log/infof "Login: %s with %s (%d sessions in cache)" username cas-ticket (count @sessions))
      {:username   username
       :person-oid (:person-oid identity)
       :token      cas-ticket})
    (log/warn "Login failed for CAS ticket " cas-ticket)))

(defn get-identity [identity]
  (if-let [cas-ticket (:token identity)]
    (get-in @sessions [cas-ticket :identity])))

(defn get-request-identity [request]
  (get-identity (-> request :session :identity)))

(defn- do-logout [cas-ticket initiator-info]
  (if-let [session (get @sessions cas-ticket)]
    (do
      (swap! sessions dissoc cas-ticket)
      (log/infof "Logout: %s with %s (%s) (%d sessions in cache)"
                 (get-in session [:identity :username])
                 cas-ticket
                 initiator-info
                 (count @sessions)))
    (log/info "Trying to logout CAS ticket without active session: " cas-ticket)))

(defn cas-initiated-logout [logout-request]
  (let [cas-ticket-option (CasLogout/parseTicketFromLogoutRequest logout-request)]
    (if (.isEmpty cas-ticket-option)
      (log/error "Could not parse ticket from CAS request: " logout-request)
      (if-let [cas-ticket (.get cas-ticket-option)]
        (do-logout cas-ticket "CAS initiated")))))

(defn user-initiated-logout [identity]
  (if-let [cas-ticket (:token identity)]
    (do-logout cas-ticket "user initiated")))
