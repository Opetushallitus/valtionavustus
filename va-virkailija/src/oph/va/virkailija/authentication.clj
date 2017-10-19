(ns oph.va.virkailija.authentication
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.login :refer [login]]
            [oph.soresu.common.config :refer [config]]
            [oph.common.background-job-supervisor :as job-supervisor]
            [clojure.core.async :refer [<! >!! alts! go chan timeout]]
            [clojure.tools.logging :as log])
  (:import (fi.vm.sade.utils.cas CasLogout)))

(def ^{:private true} tokens (atom {}))

(def ^{:private true} token-timeout-ms (* 1000 (-> config :server :session_timeout_in_s)))

(def ^{:private true} token-timeout-chan (chan 1))

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
      (let [[value _] (alts! [token-timeout-chan (timeout 500)])]
        (if (nil? value)
          (do
            (swap! tokens remove-timed-out-tokens)
            (recur)))))
    (log/info "Stopped background job: token timeout.")))

(defn start-background-job-timeout-tokens []
  (job-supervisor/start-background-job :timeout-tokens
                                       start-loop-remove-timed-out-tokens
                                       #(>!! token-timeout-chan {:operation :stop})))

(defn stop-background-job-timeout-tokens []
  (job-supervisor/stop-background-job :timeout-tokens))

(defn authenticate [ticket virkailija-login-url]
  (if-let [details (login ticket virkailija-login-url)]
    (let [username (:username details)
          token ticket]
      (swap! tokens assoc token {:details details :timeout-at-ms (+ token-timeout-ms (System/currentTimeMillis))})
      (log/info username "Logged in:" ticket (format "(%d tickets in cache)" (count @tokens)))
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
      (log/info "Logged out:" ticket (format "(%d tickets in cache)" (count @tokens))))
    (log/info "Trying to logout CAS ticket without active session:" ticket)))

(defn cas-initiated-logout [logout-request]
  (let [ticket (CasLogout/parseTicketFromLogoutRequest logout-request)]
    (if (.isEmpty ticket)
      (log/error "Could not parse ticket from CAS request" logout-request)
      (if-let [token (.get ticket)]
        (do
          (log/info "Logging out (CAS initiated):" token)
          (logout-ticket token))))))

(defn logout [identity]
  (if-let [token (:token identity)]
    (do
      (log/info "Logging out (user initiated):" token)
      (logout-ticket token))))
