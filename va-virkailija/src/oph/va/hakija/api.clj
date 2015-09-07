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
  {:id (:id avustushaku)
   :name (-> avustushaku :content :name)
   :self-financing-percentage (-> avustushaku :content :self-financing-percentage)})

(defn- roles->json [roles]
  (-> (fn [role]
        {:id (:id role)
         :name (:name role)
         :email (:email role)
         :role (:role role)})
      (map roles)))

(defn- hakemukset->json [hakemukset]
  (-> (fn [hakemus]
        (trace "Hakemus" hakemus)
        {:id (:id hakemus)
         :project-name (:project_name hakemus)
         :organization-name (:organization_name hakemus)
         :budget-oph-share (:budget_oph_share hakemus)
         :budget-total (:budget_total hakemus)
         :status (:status hakemus)
         :answers (:answer_values hakemus)})
      (map hakemukset)))

(defn get-avustushaku [avustushaku-id]
  (let [avustushaku (first (exec :hakija-db hakija-queries/get-avustushaku {:id avustushaku-id}))
        roles (get-avustushaku-roles 1)
        hakemukset (exec :hakija-db hakija-queries/list-hakemukset-by-avustushaku {:avustushaku_id avustushaku-id})]
    {:avustushaku (avustushaku->json avustushaku)
     :roles (roles->json roles)
     :hakemukset (hakemukset->json hakemukset)}))
