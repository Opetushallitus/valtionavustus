(ns oph.va.virkailija.login
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.common.config :refer [config config-simple-name]]
            [clojure.edn :as edn]
            [clj-ldap.client :as ldap]
            [clojure.tools.logging :as log])
  (:import (java.net InetAddress)))


(defn- people-path [uid]
  (str "uid=" uid ",ou=People,dc=opintopolku,dc=fi"))

(defn- ldap-pool [{:keys [hostname port user password]}]
  (ldap/connect {:host [{:address (.getHostName hostname) :port port}]
                 :bind-dn (people-path user)
                 :password password
                 :ssl? true
                 :num-connections 1}))

(defn- create-ldap-connection []
  (let [ldap-config (:ldap config)
        hostname (InetAddress/getByName (:server ldap-config))]
    (ldap-pool { :hostname hostname
                :port (:port ldap-config)
                :user (:user ldap-config)
                :password (:password ldap-config)})))

(defn login [username password]
  (let [ldap-server (create-ldap-connection)]
    (if (ldap/bind? ldap-server (people-path username) password)
      (let [ldap-desc (ldap/get ldap-server (people-path username))]
        (log/info (str "ldap-desc: '" ldap-desc "'"))
        true)
      (do
        (log/info (str "Login failed for username '" username "' "))
        false))))
