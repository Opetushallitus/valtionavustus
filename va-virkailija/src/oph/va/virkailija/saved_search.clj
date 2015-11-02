(ns oph.va.virkailija.saved-search
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:require [oph.va.virkailija.db :refer :all]
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
  (if-let [existing-search (find-search avustushaku-id search-query)]
    existing-search
    (let [name (create-search-name avustushaku-id search-query)]
      (create-search! avustushaku-id search-query name (:person-oid identity)))))

(defn create-or-get-search [avustushaku-id search-query identity]
  (:id (resolve-search avustushaku-id search-query identity)))

(defn get-saved-search [avustushaku-id saved-search-id]
  (get-search avustushaku-id saved-search-id))
