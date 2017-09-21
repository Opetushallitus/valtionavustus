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
      (swap! tokens assoc token details)
      (log/info username "logged in:" ticket (format "(%d tickets in cache)" (count @tokens)))
      {:username username
       :person-oid (:person-oid details)
       :token token})
    (log/warn "Login failed for CAS ticket " ticket)))

(defn check-identity [identity]
  (if-let [token (:token identity)]
    (get @tokens token)))

(defn get-identity [request]
  (check-identity (-> request
                      :session
                      :identity)))

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
