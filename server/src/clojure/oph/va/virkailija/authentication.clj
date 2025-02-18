(ns oph.va.virkailija.authentication
  (:require [oph.soresu.common.config :refer [config environment without-authentication?]]
            [oph.va.virkailija.cas :as cas]
            [oph.va.virkailija.va-users :as va-users]
            [oph.va.virkailija.fake-authentication :as fake-authentication]
            [oph.common.background-job-supervisor :as job-supervisor]
            [clojure.core.async :refer [>!! alts! go chan timeout]]
            [clojure.tools.logging :as log]))

(def ^:private session-store (atom {}))

(def ^:private session-timeout-chan (chan 1))

(def ^:private session-timeout-in-ms
  (when-not *compile-files*
    (-> config
        (get-in [:server :session-timeout-in-s])
        (+ 5)  ; ensure backend session timeout happens after browser session timeout
        (* 1000))))

(defn add-authentication [authentication]
  (when (and (not= environment "local") (not= environment "test"))
    (throw (Exception. "Function is only for testing")))
  (swap! session-store assoc (:cas-ticket authentication) authentication))

(defn remove-authentication [authentication]
  (when (and (not= environment "local") (not= environment "test"))
    (throw (Exception. "Function is only for testing")))
  (swap! session-store dissoc (:cas-ticket authentication)))

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
      (let [[value _] (alts! [session-timeout-chan (timeout 500)])]
        (when (nil? value)
          (swap! session-store remove-timed-out-sessions)
          (recur))))
    (log/info "Stopped background job: sessions timeout.")))

(defn start-background-job-timeout-sessions []
  (job-supervisor/start-background-job :timeout-sessions
                                       start-loop-remove-timed-out-sessions
                                       #(>!! session-timeout-chan {:operation :stop})))

(defn stop-background-job-timeout-sessions []
  (job-supervisor/stop-background-job :timeout-sessions))

(defn- authenticate-and-authorize-va-user [cas-ticket virkailija-login-url]
  (if-let [username (cas/validate-service-ticket virkailija-login-url cas-ticket)]
    (va-users/get-va-user-by-username username)))

(defn authenticate [cas-ticket virkailija-login-url]
  (if-let [identity (authenticate-and-authorize-va-user cas-ticket virkailija-login-url)]
    (do
      (swap! session-store assoc cas-ticket {:identity      identity
                                             :cas-ticket    cas-ticket
                                             :timeout-at-ms (+ session-timeout-in-ms (System/currentTimeMillis))})
      (log/infof "Login: %s with %s (%d sessions in cache)"
                 (:username identity)
                 cas-ticket
                 (count @session-store))
      true)
    (log/warn "Login failed for CAS ticket " cas-ticket)))

(defn- get-identity [session]
  (if (without-authentication?)
    (fake-authentication/get-fake-identity session)
    (get-in @session-store [(:cas-ticket session) :identity])))

(defn get-request-identity [request]
  (get-identity (:session request)))

(defn- do-logout [cas-ticket initiator-info]
  (if-let [session-data (get @session-store cas-ticket)]
    (do
      (swap! session-store dissoc cas-ticket)
      (log/infof "Logout: %s with %s (%s) (%d sessions in cache)"
                 (get-in session-data [:identity :username])
                 cas-ticket
                 initiator-info
                 (count @session-store)))
    (log/info "Trying to logout CAS ticket without active session with " cas-ticket)))

(defn cas-initiated-logout [logout-request]
  (let [cas-ticket (cas/parse-ticket logout-request)]
    (when cas-ticket
      (do-logout cas-ticket "CAS initiated"))))

(defn user-initiated-logout [cas-ticket]
  (do-logout cas-ticket "user initiated"))
