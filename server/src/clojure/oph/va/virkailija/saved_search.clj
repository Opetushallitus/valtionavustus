(ns oph.va.virkailija.saved-search
  (:require [oph.va.virkailija.db :as db]
            [oph.va.hakija.api :refer [get-avustushaku]]))

(defn- create-search-name [avustushaku-id search-query]
  (let [number-of-applications (-> search-query :hakemus-ids count)
        avustushaku-name (->> avustushaku-id
                              get-avustushaku
                              :content
                              :name
                              :fi)]
    (str avustushaku-name ": " number-of-applications " hakemusta")))

(defn- resolve-search [avustushaku-id search-query identity]
  (if-let [existing-search (db/find-search avustushaku-id search-query)]
    existing-search
    (let [name (create-search-name avustushaku-id search-query)]
      (db/create-search! avustushaku-id search-query name (:person-oid identity)))))

(defn create-or-get-search [avustushaku-id search-query identity]
  (:id (resolve-search avustushaku-id search-query identity)))

(defn get-saved-search [avustushaku-id saved-search-id]
  (db/get-search avustushaku-id saved-search-id))
