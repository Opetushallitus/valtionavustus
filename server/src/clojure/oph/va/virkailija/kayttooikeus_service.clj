(ns oph.va.virkailija.kayttooikeus-service
  (:require [cheshire.core :as cheshire]
            [clojure.tools.logging :as log]
            [oph.common.caller-id :as caller-id]
            [oph.common.string :as common-string]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.cas :refer [get-st get-tgt]]
            [org.httpkit.client :as hk-client]))

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

(defn- get-person-details [username]
  (let [tgt (get-tgt)
        st (get-st tgt service-base-url)
        res @(hk-client/get (str service-base-url
                                 "/kayttooikeus/kayttaja") {:query-params {:username username
                                                                           :ticket st}
                                                            :headers {"caller-id" caller-id/caller-id}})]
    (cheshire/parse-string (:body res) true)))


(defn- validate-response-body-count [matches username]
  (let [num-matches (count matches)]
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

(defn parse-person-privileges [person-response-body username]
  (let [match (validate-response-body-count  person-response-body username)]
    (if-let [oid (parse-person-oid match)]

      (if-let [privileges (parse-va-privileges match)]
        {:person-oid oid :privileges privileges}
        (do
          (log/warnf "Person with username \"%s\" (%s) in kayttooikeus-service is not VA admin or user" username oid)
          nil))
      (do
        (log/warnf "Person with username \"%s\" in kayttooikeus-service has empty person-oid" username)
        nil))))

(defn get-va-person-privileges [username]
  (when-let [response-body (get-person-details username)]
    (parse-person-privileges response-body username)))

(defn parse-va-people-privileges-from-response [found]
  (reduce (fn [acc person]
            (if-let [oid (parse-person-oid person)]
              (if-let [privileges (parse-va-privileges person)]
                (assoc acc oid {:privileges privileges})
                acc)
              acc))
          {}
          found))

(defn get-va-people-privileges []
  (let [tgt (get-tgt)
        st (get-st tgt service-base-url)
        res @(hk-client/get (str service-base-url
                                 "/kayttooikeus/kayttaja") {:query-params {:palvelu "VALTIONAVUSTUS"
                                                                           :ticket st}
                                                            :headers {"caller-id" caller-id/caller-id}})
        found (cheshire/parse-string (:body res) true)]

    (parse-va-people-privileges-from-response found)))
