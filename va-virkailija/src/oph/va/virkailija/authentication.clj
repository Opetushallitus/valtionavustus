(ns oph.va.virkailija.authentication
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.login :refer [login]]
            [oph.soresu.common.config :refer [config]]
            [clojure.core.async :refer [<! go timeout]]
            [clojure.tools.logging :as log])
  (:import (fi.vm.sade.utils.cas CasLogout)))

(defonce ^{:private true} tokens (atom {}))

(defonce ^{:private true} token-timeout-ms (* 1000 (-> config :server :session_timeout_in_s)))

(defonce ^{:private true} token-timeout-agent (agent {:run-job? false}))

(defn- remove-timed-out-tokens [tokens]
  (let [now-time-ms (System/currentTimeMillis)]
    (reduce-kv (fn [acc token data]
                 (let [timeout-at-ms (:timeout-at-ms data)]
                   (if (< timeout-at-ms now-time-ms)
                     acc
                     (assoc acc token data))))
               {}
               tokens)))

(defn- start-loop-remove-timed-out-tokens []
  (go
    (log/info "Starting background job: token timeout...")
    (loop []
      (<! (timeout 500))
      (swap! tokens remove-timed-out-tokens)
      (if (:run-job? @token-timeout-agent)
        (recur)))
    (log/info "Stopped background job: token timeout.")))

(defn start-background-job-token-timeout []
  (send token-timeout-agent
        (fn [{:keys [run-job?] :as state}]
          (if run-job?
            state  ; do nothing, already running
            (do
              (start-loop-remove-timed-out-tokens)
              (assoc state :run-job? true))))))

(defn stop-background-job-token-timeout []
  (send token-timeout-agent assoc :run-job? false))

(defn authenticate [ticket virkailija-login-url]
  (if-let [details (login ticket virkailija-login-url)]
    (let [username (:username details)
          token ticket]
      (swap! tokens assoc token {:details details :timeout-at-ms (+ token-timeout-ms (System/currentTimeMillis))})
      (log/info username "logged in:" ticket (format "(%d tickets in cache)" (count @tokens)))
      {:username username
       :person-oid (:person-oid details)
       :token token})
    (log/warn "Login failed for CAS ticket " ticket)))

(defn get-identity [identity]
  (if-let [token (:token identity)]
    (get-in @tokens [token :details])))

(defn get-request-identity [request]
  (get-identity (-> request :session :identity)))

(defn- logout-ticket [ticket]
  (if (contains? @tokens ticket)
    (do
      (swap! tokens dissoc ticket)
      (log/info "logged out:" ticket (format "(%d tickets in cache)" (count @tokens))))
    (log/info "trying to logout CAS ticket without active session:" ticket)))

(defn cas-initiated-logout [logout-request]
  (let [ticket (CasLogout/parseTicketFromLogoutRequest logout-request)]
    (if (.isEmpty ticket)
      (log/error "Could not parse ticket from CAS request" logout-request)
      (if-let [token (.get ticket)]
        (do
          (log/info "logging out (CAS initiated):" token)
          (logout-ticket token))))))

(defn logout [identity]
  (if-let [token (:token identity)]
    (do
      (log/info "logging out (user initiated):" token)
      (logout-ticket token))))
