(ns oph.va.hakija.api
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:require [oph.common.db :refer :all]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.routes :refer :all]))


(defn health-check []
  (->> {}
       (exec :hakija-db hakija-queries/health-check)
       first
       :?column?
       (= 1)))

(defn list-avustushaut []
  (exec :hakija-db hakija-queries/list-avustushaut {}))

(defn- get-avustushaku-roles [avustushaku-id]
  (exec :hakija-db hakija-queries/get-avustushaku-roles {:avustushaku_id avustushaku-id}))

(defn- form->json [form]
  {:content (:content form)
   :rules (:rules form)})

(defn- roles->json [roles]
  (-> (fn [role]
        {:id (:id role)
         :name (:name role)
         :email (:email role)
         :role (:role role)})
      (map roles)))

(defn- hakemukset->json [hakemukset]
  (-> (fn [hakemus]
        {:id (:id hakemus)
         :project-name (:project_name hakemus)
         :organization-name (:organization_name hakemus)
         :budget-oph-share (:budget_oph_share hakemus)
         :budget-total (:budget_total hakemus)
         :status (:status hakemus)
         :user-key (:user_key hakemus)
         :answers (:answer_values hakemus)})
      (map hakemukset)))

(defn get-avustushaku [avustushaku-id]
  (let [avustushaku (first (exec :hakija-db hakija-queries/get-avustushaku {:id avustushaku-id}))
        form (first (exec :hakija-db hakija-queries/get-form-by-avustushaku {:avustushaku_id avustushaku-id}))
        roles (get-avustushaku-roles 1)
        hakemukset (exec :hakija-db hakija-queries/list-hakemukset-by-avustushaku {:avustushaku_id avustushaku-id})]
    {:avustushaku (avustushaku-response-content avustushaku)
     :roles (roles->json roles)
     :form (form->json form)
     :hakemukset (hakemukset->json hakemukset)
     :budget-total-sum (reduce + (map :budget_total hakemukset))
     :budget-oph-share-sum (reduce + (map :budget_oph_share hakemukset))}))
