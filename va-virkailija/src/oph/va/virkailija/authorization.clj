(ns oph.va.virkailija.authorization
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.ldap :as ldap]
            [clojure.tools.logging :as log]))

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
