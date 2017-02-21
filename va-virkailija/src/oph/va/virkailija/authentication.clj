(ns oph.va.virkailija.authentication
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.login :refer [login]]
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
    (log/warn "Login failed for CAS ticket " ticket)))

(defn check-identity [identity]
  (if-let [{:keys [token username]} identity]
    (get @tokens token)))

(defn get-identity [request]
  (check-identity (-> request
                      :session
                      :identity)))

(defn logout-ticket [ticket]
  (if (contains? @tokens ticket)
    (do
      (log/info ticket "logged out")
      (swap! tokens dissoc ticket))
    (log/info "trying to logout CAS ticket without active session" ticket)))

(defn cas-initiated-logout [logout-request]
  (let [ticket (CasLogout/parseTicketFromLogoutRequest logout-request)]
    (if (.isEmpty ticket)
      (log/error "Could not parse ticket from CAS request" logout-request)
      (logout-ticket (.get ticket)))))

(defn logout [identity]
  (if-let [{:keys [token username]} identity]
    (logout-ticket token)))
