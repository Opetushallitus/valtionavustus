(ns oph.va.virkailija.auth
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.login :refer [login get-details]]
            [clojure.tools.logging :as log])
  (:import (fi.vm.sade.utils.cas CasLogout)))

(defonce tokens (atom {}))

(defn authenticate [ticket virkailija-login-url]
  (if-let [details (login ticket virkailija-login-url)]
    (let [username (:username details)
          token ticket]
      (log/info username "logged in succesfully with ticket" ticket)
      (swap! tokens assoc token details)
      {:username username
       :person-oid (:person-oid details)
       :token token})
    (log/warn "Log-in failed for cas ticket " ticket)))

(defn check-identity [identity]
  (if-let [{:keys [token username]} identity]
    (if (contains? @tokens token)
      (get @tokens token)
      (when-let [details (get-details username)]
        (swap! tokens assoc token details)
        details))))

(defn get-identity [request]
  (check-identity (-> request
                      :session
                      :identity)))

(defn logout-ticket [ticket]
  (log/info ticket "logged out")
  (swap! tokens dissoc ticket))

(defn cas-initiated-logout [logout-request]
  (let [ticket (CasLogout/parseTicketFromLogoutRequest logout-request)]
    (if (.isEmpty ticket)
      (log/error "Could not parse ticket from CAS request" logout-request)
      (logout-ticket (.get ticket)))))

(defn logout [identity]
  (if-let [{:keys [token username]} identity]
    (logout-ticket token)))
