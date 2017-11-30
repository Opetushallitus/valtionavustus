(ns oph.va.virkailija.kayttooikeus-service
  (:require [oph.soresu.common.config :refer [config]]
            [oph.common.string :as common-string]
            [oph.va.virkailija.cas :as cas]
            [oph.va.virkailija.http :as http]
            [oph.va.virkailija.url :as url]
            [clojure.tools.logging :as log]))

(def ^:private va-service-name
  (when-not *compile-files*
    (get-in config [:kayttooikeus-service :va-service-name])))

(def ^:private kayttooikeus-to-va-privileges
  (when-not *compile-files*
    (let [admin-privilege-name (get-in config [:kayttooikeus-service :admin-privilege-name])
          user-privilege-name  (get-in config [:kayttooikeus-service :user-privilege-name])]
      {admin-privilege-name "va-admin"
       user-privilege-name  "va-user"})))

(def service-base-url
  (when-not *compile-files*
    (str (get-in config [:opintopolku :url]) "/kayttooikeus-service")))

(def ^:private service-client
  (when-not *compile-files*
    (delay (http/make-http-client (cas/make-cas-authenticating-client service-base-url)))))

(defn make-person-kayttooikeus-url [query]
  (str service-base-url "/kayttooikeus/kayttaja?" (url/encode-map->query query)))

(defn- get-person-details [username]
  (let [matches     (http/client-get-json @service-client
                                          (str service-base-url
                                               "/kayttooikeus/kayttaja?"
                                               (url/encode-map->query {:username username})))
        num-matches (count matches)]
    (cond
      (= num-matches 1)
      (first matches)

      (= num-matches 0)
      (do
        (log/warnf "No person with username \"%s\" found from kayttooikeus-service" username)
        nil)

      (> num-matches 1)
      (do
        (log/errorf "%d people match username \"%s\" in kayttooikeus-service, unable to decide matching user" num-matches username)
        nil))))

(defn- parse-person-oid [person]
  (common-string/trimmed-or-nil (:oidHenkilo person)))

(defn- parse-va-privilege [privilege]
  (when (= (:palvelu privilege) va-service-name)
    (get kayttooikeus-to-va-privileges (:oikeus privilege))))

(defn- parse-va-privileges [person]
  (->> :organisaatiot
       person
       (mapcat :kayttooikeudet)
       (keep parse-va-privilege)
       seq))

(defn get-va-person-privileges [username]
  (when-let [person (get-person-details username)]
    (if-let [oid (parse-person-oid person)]
      (if-let [privileges (parse-va-privileges person)]
        {:person-oid oid :privileges privileges}
        (do
          (log/warnf "Person with username \"%s\" (%s) in kayttooikeus-service is not VA admin or user" username oid)
          nil))
      (do
        (log/warnf "Person with username \"%s\" in kayttooikeus-service has empty person-oid" username)
        nil))))

(defn get-va-people-privileges []
  (let [found (http/client-get-json @service-client
                                    (str service-base-url
                                         "/kayttooikeus/kayttaja?palvelu=VALTIONAVUSTUS"))]
    (reduce (fn [acc person]
              (if-let [oid (parse-person-oid person)]
                (if-let [privileges (parse-va-privileges person)]
                  (assoc acc oid {:privileges privileges})
                  acc)
                acc))
            {}
            found)))
