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
  (str "uid=" uid "," (people-path-base)))

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

(defn- has-group? [user-details required-group]
  (let [description (-> user-details :description json/parse-string)]
    (boolean (some #{required-group} description))))

(defn check-app-access [ldap-server username]
  (let [user-details (find-user-details ldap-server username)
        description (-> user-details :description json/parse-string)
        required-group (-> config :ldap :required-group)
        admin-group (-> config :ldap :admin-group)]
    (if (or (has-group? user-details required-group) (has-group? user-details admin-group))
      description
      (log/warn (str "Authorization failed for username '" username "' : did not have either "
                     required-group " or " admin-group" , got only "
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

(defn details->map-with-roles [user-details]
  (merge (details->map user-details)
         {:va-user (has-group? user-details (-> config :ldap :required-group))
          :va-admin (has-group? user-details (-> config :ldap :admin-group))}))

(defn- by-access-and-name [user1 user2]
  (compare [(:va-user user2) (:va-admin user2) (:surname user1) (:first-name user1)]
           [(:va-user user1) (:va-admin user1) (:surname user2) (:first-name user2)]))

(defn search-users [search-input]
  (let [ldap-server (create-ldap-connection)
        search-terms (clojure.string/split search-input #" ")
        filter-string (create-and-filter search-terms)]
    (->> (do-with-ldap ldap-server #(ldap/search ldap-server (people-path-base) {:filter filter-string}))
         (map details->map-with-roles)
         (sort by-access-and-name))))

