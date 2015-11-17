(ns oph.va.virkailija.auth
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.login :refer [login]]
            [oph.va.virkailija.ldap :as ldap]
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
    (log/warn "trying to logout CAS ticket without active session" ticket)))

(defn cas-initiated-logout [logout-request]
  (let [ticket (CasLogout/parseTicketFromLogoutRequest logout-request)]
    (if (.isEmpty ticket)
      (log/error "Could not parse ticket from CAS request" logout-request)
      (logout-ticket (.get ticket)))))

(defn logout [identity]
  (if-let [{:keys [token username]} identity]
    (logout-ticket token)))

(defn- has-oid? [oid role]
  (= oid (:oid role)))

(defn- resolve-privileges-for-user [user-with-roles haku-data]
  (let [user-oid (:person-oid user-with-roles)
        haku-role-of-user (->> (:roles haku-data)
                               (filter #(has-oid? user-oid %))
                               first)
        is-presenter (= "presenting_officer" (:role haku-role-of-user))
        is-evaluator (= "evaluator" (:role haku-role-of-user))]
    {:edit-haku (or is-presenter (:va-admin user-with-roles))
     :score-hakemus (or is-presenter is-evaluator)
     :change-hakemus-state is-presenter}))

(defn resolve-privileges [identity haku-data]
  (let [user-with-roles (->> identity
                             :username
                             (ldap/find-user-details (ldap/create-ldap-connection))
                             ldap/details->map-with-roles)]
    (if (:person-oid user-with-roles)
        (resolve-privileges-for-user user-with-roles haku-data)
        (do (log/error (str "Could not find user details for " identity " to access " (:avustushaku haku-data)))
            {:edit-haku false
             :score-hakemus false
             :change-hakemus-state false}))))
