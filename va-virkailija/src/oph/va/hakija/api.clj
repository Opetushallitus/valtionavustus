(ns oph.va.hakija.api
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:require [clojure.java.io :as io]
            [oph.common.db :refer :all]
            [oph.common.jdbc.enums :refer :all]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.routes :refer :all]
            [oph.common.jdbc.enums :refer :all])
  (:import (oph.common.jdbc.enums HakuStatus HakuRole)))

(defn- convert-attachment [attachment]
  {:id (:id attachment)
   :hakemus-id (:hakemus_id attachment)
   :version (:version attachment)
   :field-id (:field_id attachment)
   :file-size (:file_size attachment)
   :content-type (:content_type attachment)
   :hakemus-version (:hakemus_version attachment)
   :created-at (:created_at attachment)
   :filename (:filename attachment)})

(defn attachments->map [attachments]
  (->> attachments
       (map convert-attachment)
       (map (fn [attachment] [(:field-id attachment) attachment]))
       (into {})))

(defn health-check []
  (->> {}
       (exec :hakija-db hakija-queries/health-check)
       first
       :?column?
       (= 1)))

(defn create-avustushaku [avustushaku-content template-form-id]
  (let [form-id (:id (exec :hakija-db
                           hakija-queries/copy-form<!
                           {:id template-form-id}))
        avustushaku-id (exec :hakija-db
                              hakija-queries/create-avustushaku<!
                              {:form form-id
                               :content avustushaku-content})]
    (->> avustushaku-id
         (exec :hakija-db hakija-queries/get-avustushaku)
         (map avustushaku-response-content )
         first)))

(defn update-avustushaku [avustushaku]
  (let [haku-status (if (= (:status avustushaku) "new")
                      (new HakuStatus "draft")
                      (new HakuStatus (:status avustushaku)))
        avustushaku-to-save (assoc avustushaku :status haku-status)]
    (exec-all :hakija-db
              [hakija-queries/archive-avustushaku! avustushaku-to-save
               hakija-queries/update-avustushaku! avustushaku-to-save])
    (->> avustushaku-to-save
         (exec :hakija-db hakija-queries/get-avustushaku)
         (map avustushaku-response-content)
         first)))

(defn list-avustushaut []
  (map avustushaku-response-content(exec :hakija-db hakija-queries/list-avustushaut {})))

(defn- role->json [role]
  {:id (:id role)
   :name (:name role)
   :email (:email role)
   :role (:role role)})

(defn- roles->json [roles]
  (-> role->json
      (map roles)))

(defn create-avustushaku-role [role]
  (let [role-enum (new HakuRole (:role role))
        role-to-save (assoc role :role role-enum)
        role-id (exec :hakija-db hakija-queries/create-avustushaku-role<! role-to-save)]
    (->> role-id
         (exec :hakija-db hakija-queries/get-avustushaku-role)
         (map role->json)
         first)))

(defn delete-avustushaku-role [avustushaku-id role-id]
 (exec :hakija-db hakija-queries/delete-avustushaku-role! {:avustushaku-id avustushaku-id
                                                           :id role-id}))

(defn get-avustushaku-roles [avustushaku-id]
  (roles->json (exec :hakija-db hakija-queries/get-avustushaku-roles {:avustushaku_id avustushaku-id})))

(defn- form->json [form]
  {:content (:content form)
   :rules (:rules form)})

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

(defn- convert-attachment-group [group]
  (let [id (-> group first :hakemus_id)]
    [id (attachments->map group)]))

(defn get-form-by-avustushaku [avustushaku-id]
  (first (exec :hakija-db hakija-queries/get-form-by-avustushaku {:avustushaku_id avustushaku-id})))

(defn get-avustushaku [avustushaku-id]
  (let [avustushaku (first (exec :hakija-db hakija-queries/get-avustushaku {:id avustushaku-id}))
        form (get-form-by-avustushaku avustushaku-id)
        roles (get-avustushaku-roles avustushaku-id)
        hakemukset (exec :hakija-db hakija-queries/list-hakemukset-by-avustushaku {:avustushaku_id avustushaku-id})
        attachments (exec :hakija-db hakija-queries/list-attachments-by-avustushaku {:avustushaku_id avustushaku-id})]
    {:avustushaku (avustushaku-response-content avustushaku)
     :environment (environment-content)
     :roles roles
     :form (form->json form)
     :hakemukset (hakemukset->json hakemukset)
     :attachments (->> attachments
                       (partition-by (fn [attachment] (:hakemus_id attachment)))
                       (mapv convert-attachment-group)
                       (into {}))
     :budget-total-sum (reduce + (map :budget_total hakemukset))
     :budget-oph-share-sum (reduce + (map :budget_oph_share hakemukset))}))

(defn list-attachments [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec :hakija-db hakija-queries/list-attachments)))

(defn attachment-exists? [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec :hakija-db hakija-queries/attachment-exists?)
       first))

(defn download-attachment [hakemus-id field-id]
  (let [result (->> {:hakemus_id hakemus-id
                     :field_id field-id}
                    (exec :hakija-db hakija-queries/download-attachment)
                    first)]
    {:data (io/input-stream (:file_data result))
     :content-type (:content_type result)
     :filename (:filename result)
     :size (:file_size result)}))
