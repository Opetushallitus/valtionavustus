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

(defn- create-ldap-connection []
  (let [ldap-config (:ldap config)
        hostname (InetAddress/getByName (:server ldap-config))]
    (ldap-pool {:hostname hostname
                :port (:port ldap-config)
                :user (:user ldap-config)
                :password (:password ldap-config)})))

(defn do-with-ldap [operation]
  (with-open [ldap-server (create-ldap-connection)]
    (operation ldap-server)))

(defn find-user-details [username]
  (do-with-ldap (fn [ldap-server] (ldap/get ldap-server (people-path username)))))

(defn- has-group? [user-details required-group]
  (let [description (-> user-details :description json/parse-string)]
    (boolean (some #{required-group} description))))

(defn- details->map [details]
  (when details
    {:username (:uid details)
     :person-oid (:employeeNumber details)
     :first-name (:cn details)
     :surname (:sn details)
     :email (:mail details)
     :lang (:preferredLanguage details)}))

(defn check-app-access [username]
  (let [user-details (find-user-details username)
        description (-> user-details :description json/parse-string)
        required-group (-> config :ldap :required-group)
        admin-group (-> config :ldap :admin-group)]
    (if (or (has-group? user-details required-group) (has-group? user-details admin-group))
      (details->map user-details)
      (log/warn (str "Authorization failed for username '" username "' : did not have either "
                     required-group " or " admin-group" , got only "
                     (pr-str description))))))

(defn- create-or-filter [search-term]
  (letfn [(create-matcher [attribute] (str "(" attribute "=*" search-term ")(" attribute "=" search-term "*)"))]
    (let [matchers (mapv create-matcher ["mail" "givenName" "sn" "cn"])]
      (str "(|" (clojure.string/join matchers)")"))))

(defn- create-and-filter [search-terms]
  (let [conditions (mapv create-or-filter search-terms)]
        (str "(&" "(employeeNumber=*)" (clojure.string/join conditions)")")))

(defn search-input->ldap-filter [search-input]
  (-> search-input
      (clojure.string/split #"\s+")
      distinct
      create-and-filter))

(defn details->map-with-roles [user-details]
  (merge (details->map user-details)
         {:va-user (has-group? user-details (-> config :ldap :required-group))
          :va-admin (has-group? user-details (-> config :ldap :admin-group))}))

(defn- user-sorting-criteria [user]
  [(not (:va-user user)) (not (:va-admin user)) (:surname user) (:first-name user)])

(defn search-users [search-input]
  (let [ldap-filter (search-input->ldap-filter search-input)
        ldap-result (do-with-ldap #(ldap/search % (people-path-base) {:filter ldap-filter}))]
    (->> ldap-result
         (map details->map-with-roles)
         (reduce (fn [acc m] (assoc acc (:person-oid m) m)) {})
         vals
         (sort-by user-sorting-criteria))))

