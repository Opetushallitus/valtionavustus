(ns oph.va.hakija.api
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:require [clojure.java.io :as io]
            [oph.soresu.common.db :refer :all]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.routes :refer :all]
            [clojure.tools.logging :as log])
  (:import (oph.va.jdbc.enums HakuStatus HakuRole)))

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
                               :content avustushaku-content
                               :register_number nil})]
    (->> avustushaku-id
         (exec :hakija-db hakija-queries/get-avustushaku)
         (map avustushaku-response-content)
         first)))

(defn update-avustushaku [avustushaku]
  (let [haku-status (if (= (:status avustushaku) "new")
                      (new HakuStatus "draft")
                      (new HakuStatus (:status avustushaku)))
        register-number (:register-number avustushaku)
        avustushaku-to-save (-> (assoc avustushaku :status haku-status)
                                (assoc :register_number register-number))]
    (exec-all :hakija-db
              [hakija-queries/archive-avustushaku! avustushaku-to-save
               hakija-queries/update-avustushaku! avustushaku-to-save])
    (->> avustushaku-to-save
         (exec :hakija-db hakija-queries/get-avustushaku)
         (map avustushaku-response-content)
         first)))

(defn list-avustushaut []
  (map avustushaku-response-content (exec :hakija-db hakija-queries/list-avustushaut {})))

(defn list-avustushaut-by-status [status]
  (map avustushaku-response-content (exec :hakija-db hakija-queries/list-avustushaut-by-status {:status (new HakuStatus status)})))

(defn- role->json [role]
  {:id (:id role)
   :name (:name role)
   :email (:email role)
   :role (:role role)
   :oid (:oid role)})

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
 (exec :hakija-db hakija-queries/delete-avustushaku-role! {:avustushaku avustushaku-id
                                                           :id role-id}))

(defn update-avustushaku-role [avustushaku-id role]
  (let [role-enum (new HakuRole (:role role))
        role-to-save (assoc (assoc role :role role-enum) :avustushaku avustushaku-id)]
    (exec :hakija-db hakija-queries/update-avustushaku-role! role-to-save)
    (->> role-to-save
       (exec :hakija-db hakija-queries/get-avustushaku-role)
         (map role->json)
         first)))

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
         :register-number (:register_number hakemus)
         :user-key (:user_key hakemus)
         :answers (:answer_values hakemus)})
      (map hakemukset)))

(defn- convert-attachment-group [group]
  (let [id (-> group first :hakemus_id)]
    [id (attachments->map group)]))

(defn get-form-by-avustushaku [avustushaku-id]
  (first (exec :hakija-db hakija-queries/get-form-by-avustushaku {:avustushaku_id avustushaku-id})))

(defn get-avustushaku [avustushaku-id]
  (first (exec :hakija-db hakija-queries/get-avustushaku {:id avustushaku-id})))

(defn get-hakudata [avustushaku-id]
  (let [avustushaku (get-avustushaku avustushaku-id)
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

(defn- update-form! [form-id form-content]
  ;; NOTE: looks like yesql unwraps sequence parameters, thats way we wrap them one extra time here
  ;; TODO: Consolidate with oph.soresu.form.db currently in soresu-form
  (let [params {:form_id form-id :content (list (:content form-content)) :rules (list (:rules form-content))}]
    (exec-all :hakija-db [hakija-queries/archive-form! { :form_id form-id }
                          hakija-queries/update-form! params])))

(defn update-form-by-avustushaku [avustushaku-id form]
  (let [form-id (-> avustushaku-id
                    (get-form-by-avustushaku)
                    :id)
        form-to-save (assoc form :form_id form-id)]
    (try (update-form! form-id form-to-save)
         (catch Exception e (throw (get-next-exception-or-original e))))
    (get-form-by-avustushaku avustushaku-id)))

(defn update-hakemus-status [hakemus-id status]
  (let [hakemus-to-update (first (exec :hakija-db hakija-queries/get-hakemus {:id hakemus-id}))
        updated-hakemus (merge hakemus-to-update {:status (keyword status)
                                                  :avustushaku_id (:avustushaku hakemus-to-update)})]
    (exec-all :hakija-db [hakija-queries/lock-hakemus hakemus-to-update
                          hakija-queries/close-existing-hakemus! hakemus-to-update
                          hakija-queries/update-hakemus-status<! updated-hakemus])))
