(ns oph.va.hakija.api
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:require [oph.common.db :refer :all]
            [oph.va.hakija.api.queries :as hakija-queries]))


(defn health-check []
  (->> {}
       (exec :hakija-db hakija-queries/health-check)
       first
       :?column?
       (= 1)))

(defn list-hakemukset [avustushaku-id]
  (exec :hakija-db hakija-queries/list-hakemukset { :avustushaku_id avustushaku-id }))

(defn list-avustushaut []
  (exec :hakija-db hakija-queries/list-avustushaut {}))

(defn- get-avustushaku-roles [avustushaku-id]
  (exec :hakija-db hakija-queries/get-avustushaku-roles {:avustushaku_id avustushaku-id}))

(defn- avustushaku->json [avustushaku]
  {:name (-> avustushaku :content :name)
   :self-financing-percentage (-> avustushaku :content :self-financing-percentage)})

(defn- roles->json [roles]
  roles)

(defn- hakemukset->json [hakemukset]
  hakemukset)

(defn get-avustushaku [avustushaku-id]
  (let [avustushaku (first (exec :hakija-db hakija-queries/get-avustushaku {:id avustushaku-id}))
        roles (get-avustushaku-roles 1)
        hakemukset (exec :hakija-db hakija-queries/list-hakemukset-by-avustushaku {:avustushaku_id avustushaku-id})]
    {:avustushaku (avustushaku->json avustushaku)
     :roles (roles->json roles)
     :hakemukset (hakemukset->json hakemukset)}))
