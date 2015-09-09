(ns oph.va.virkailija.login
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.common.config :refer [config config-simple-name]]
            [clojure.edn :as edn]
            [cheshire.core :as json]
            [clj-ldap.client :as ldap]
            [clojure.tools.logging :as log])
  (:import (java.net InetAddress)))

(defn- people-path [uid]
  (let [people-path-base (-> config :ldap :people-path-base)]
    (str "uid=" uid people-path-base)))

(defn- ldap-pool [{:keys [hostname port user password]}]
  (ldap/connect {:host [{:address (.getHostName hostname) :port port}]
                 :bind-dn (people-path user)
                 :password password
                 :ssl? true
                 :num-connections 1}))

(defn- create-ldap-connection []
  (let [ldap-config (:ldap config)
        hostname (InetAddress/getByName (:server ldap-config))]
    (ldap-pool {:hostname hostname
                :port (:port ldap-config)
                :user (:user ldap-config)
                :password (:password ldap-config)})))

(defn- find-user-details [ldap-server username]
  (ldap/bind? ldap-server
              (people-path (-> config :ldap :user))
              (-> config :ldap :password))
  (ldap/get ldap-server (people-path username)))

(defn- check-app-access [ldap-server username]
  (let [user-details (find-user-details ldap-server username)
        description (-> user-details :description json/parse-string)
        required-group (-> config :ldap :required-group)
        has-access? (some #{required-group} description)]
    (if has-access?
      description
      (log/info (str "Authorization failed for username '"
                     username "' : "
                     required-group " missing, got only "
                     (pr-str description))))))

(defn login [username password]
  (let [ldap-server (create-ldap-connection)
        credentials-valid? (ldap/bind? ldap-server (people-path username) password)]
    (if credentials-valid?
      (check-app-access ldap-server username)
      (log/info (str "Login failed for username '" username "'")))))
