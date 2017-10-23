(ns oph.va.virkailija.login
  (:require [oph.va.virkailija.ldap :as ldap]
            [oph.va.virkailija.cas :as cas]))

(defn login [cas-ticket virkailija-login-url]
  (if-let [username (cas/validate-service-ticket virkailija-login-url cas-ticket)]
    (ldap/check-app-access username)))
