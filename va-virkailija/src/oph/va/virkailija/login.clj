(ns oph.va.virkailija.login
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.common.config :refer [config config-simple-name]]
            [oph.va.virkailija.ldap :as ldap]
            [clj-util.cas :as cas]))

(defn login [cas-ticket virkailija-login-url]
  (let [cas-client (cas/cas-client (-> config :opintopolku :url))
        username (.run (.validateServiceTicket cas-client virkailija-login-url cas-ticket))]
  (if username
    (ldap/check-app-access username))))
