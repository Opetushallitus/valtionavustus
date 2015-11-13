(ns oph.va.virkailija.ldap
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.common.config :refer [config config-simple-name]]
            [cheshire.core :as json]
            [clj-ldap.client :as ldap]
            [clojure.tools.logging :as log])
  (:import (java.net InetAddress)))

(defn- people-path-base []
  (-> config :ldap :people-path-base))

(defn- people-path [uid]
  (str "uid=" uid (people-path-base)))

(defn- ldap-pool [{:keys [hostname port user password]}]
  (ldap/connect {:host [{:address (.getHostName hostname) :port port}]
                 :bind-dn (people-path user)
                 :password password
                 :ssl? true
                 :num-connections 1}))

(defn create-ldap-connection []
  (let [ldap-config (:ldap config)
        hostname (InetAddress/getByName (:server ldap-config))]
    (ldap-pool {:hostname hostname
                :port (:port ldap-config)
                :user (:user ldap-config)
                :password (:password ldap-config)})))

(defn- do-with-ldap [ldap-server operation]
  (ldap/bind? ldap-server
              (people-path (-> config :ldap :user))
              (-> config :ldap :password))
  (operation))

(defn find-user-details [ldap-server username]
  (do-with-ldap ldap-server #(ldap/get ldap-server (people-path username))))

(defn check-app-access [ldap-server username]
  (let [user-details (find-user-details ldap-server username)
        description (-> user-details :description json/parse-string)
        required-group (-> config :ldap :required-group)
        has-access? (some #{required-group} description)]
    (if has-access?
      description
      (log/warn (str "Authorization failed for username '"
                     username "' : "
                     required-group " missing, got only "
                     (pr-str description))))))

(defn details->map [details]
  (when details
    {:username (:uid details)
     :person-oid (:employeeNumber details)
     :first-name (:cn details)
     :surname (:sn details)
     :email (:mail details)
     :lang (:preferredLanguage details)}))

(defn get-details [username]
  (let [ldap-server (create-ldap-connection)]
    (details->map (find-user-details ldap-server username))))

(defn- create-or-filter [search-term]
  (letfn [(create-matcher [attribute] (str "(" attribute "=*" search-term ")(" attribute "=" search-term "*)"))]
    (let [matchers (mapv create-matcher ["mail" "givenName" "sn" "cn"])]
      (str "(|" (clojure.string/join matchers)")"))))

(defn- create-and-filter [search-terms]
  (let [conditions (mapv create-or-filter search-terms)]
        (str "(&" (clojure.string/join conditions)")")))

(defn search-users [search-input]
  (let [ldap-server (create-ldap-connection)
        base-without-comma (subs (people-path-base) 1) ;; TODO Change config to not include comma
        search-terms (clojure.string/split search-input #" ")
        filter-string (create-and-filter search-terms)
        raw-results (do-with-ldap ldap-server #(ldap/search ldap-server base-without-comma {:filter filter-string}))]
    (map details->map raw-results)))

