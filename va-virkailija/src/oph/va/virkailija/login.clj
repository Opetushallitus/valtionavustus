(ns oph.va.virkailija.login
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.common.config :refer [config config-simple-name]]
            [oph.va.virkailija.ldap :refer :all]
            [clj-util.cas :as cas]))

(defn login [cas-ticket virkailija-login-url]
  (let [cas-client (cas/cas-client (-> config :opintopolku :url))
        username (.run (.validateServiceTicket cas-client virkailija-login-url cas-ticket))]
  (if username
    (let [ldap-server (create-ldap-connection)]
      (when (check-app-access ldap-server username)
        (details->map (find-user-details ldap-server username)))))))
