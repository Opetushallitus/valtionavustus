(ns oph.va.hakija.api
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:require [clojure.java.io :as io]
            [oph.soresu.common.db :refer :all]
            [oph.soresu.form.formhandler :as formhandler]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.routes :refer :all]
            [clojure.tools.logging :as log]
            [oph.soresu.form.formutil :as formutil])
  (:import (oph.va.jdbc.enums HakuStatus HakuRole)))

(defn convert-attachment [attachment]
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
        avustushaku-to-save (-> (assoc avustushaku :status haku-status)
                                (assoc :register_number (:register-number avustushaku))
                                (assoc :multiple_rahoitusalue (:multiple-rahoitusalue avustushaku)))]
    (exec-all :hakija-db
              [hakija-queries/archive-avustushaku! avustushaku-to-save
               hakija-queries/update-avustushaku! avustushaku-to-save])
    (->> avustushaku-to-save
         (exec :hakija-db hakija-queries/get-avustushaku)
         (map avustushaku-response-content)
         first)))

(defn get-avustushaku [id]
  (first (exec :hakija-db hakija-queries/get-avustushaku {:id id})))

(defn list-avustushaut []
  (map avustushaku-response-content (exec :hakija-db hakija-queries/list-avustushaut {})))

(defn- map-status-list [statuses]
  (map (fn [status] (new HakuStatus status)) statuses))

(defn list-avustushaut-by-status [statuses]
  (if statuses
    (map avustushaku-response-content (exec :hakija-db hakija-queries/list-avustushaut-by-status {:statuses (map-status-list statuses)}))
    (list-avustushaut)))

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
  (let [form-for-rendering (formhandler/add-koodisto-values :hakija-db form)]
    {:content (:content form-for-rendering)
       :rules (:rules form-for-rendering)}))

(defn- hakemus->json [hakemus]
  {:id (:id hakemus)
   :version (:version hakemus)
   :version-date (:created_at hakemus)
   :project-name (:project_name hakemus)
   :organization-name (:organization_name hakemus)
   :budget-oph-share (:budget_oph_share hakemus)
   :budget-total (:budget_total hakemus)
   :status (:status hakemus)
   :status-comment (:status_change_comment hakemus)
   :user-first-name (:user_first_name hakemus)
   :user-last-name (:user_last_name hakemus)
   :register-number (:register_number hakemus)
   :user-key (:user_key hakemus)
   :answers (:answer_values hakemus)})

(defn- paatos-sent-emails->json [paatos]
  {:id (:id paatos)
   :version (:version paatos)
   :project-name (:project_name paatos)
   :sent-emails (:sent_emails paatos)})

(defn- hakemukset->json [hakemukset]
  (map hakemus->json hakemukset))

(defn- convert-attachment-group [group]
  (let [id (-> group first :hakemus_id)]
    [id (attachments->map group)]))

(defn get-form-by-avustushaku [avustushaku-id]
  (first (exec :hakija-db hakija-queries/get-form-by-avustushaku {:avustushaku_id avustushaku-id})))

(defn get-avustushaku [avustushaku-id]
  (first (exec :hakija-db hakija-queries/get-avustushaku {:id avustushaku-id})))

(defn get-avustushaku-by-status [avustushaku-id statuses]
  (first (exec :hakija-db hakija-queries/get-avustushaku-by-status {:id avustushaku-id :statuses (map-status-list statuses)})))

(defn get-paatos-sent-emails [avustushaku-id]
  (let [paatos-sent-emails (exec :hakija-db hakija-queries/list-hakemus-decision-email-statuses {:avustushaku_id avustushaku-id})]
    (map paatos-sent-emails->json paatos-sent-emails)))

(defn add-paatos-sent-emails [hakemus emails]
  (exec :hakija-db hakija-queries/add-hakemus-decision! {:hakemus_id (:id hakemus)
                                                         :hakemus_version (:version hakemus)
                                                         :sent_emails {:addresses ["a" "b"]}}))

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

(defn get-hakemusdata [hakemus-id]
  (let [hakemus (first (exec :hakija-db hakija-queries/get-hakemus-with-answers {:id hakemus-id}))
        avustushaku-id (:avustushaku hakemus)
        avustushaku (get-avustushaku avustushaku-id)
        form (get-form-by-avustushaku avustushaku-id)
        roles (get-avustushaku-roles avustushaku-id)]
    {:avustushaku (avustushaku-response-content avustushaku)
     :roles       roles
     :form        (form->json form)
     :hakemus     (hakemus->json hakemus)}))

(defn list-attachments [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec :hakija-db hakija-queries/list-attachments)))

(defn list-attachment-versions [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec :hakija-db hakija-queries/list-attachment-versions)))

(defn attachment-exists? [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec :hakija-db hakija-queries/attachment-exists?)
       first))

(defn- query-attachment [hakemus-id field-id attachment-version]
  (let [params {:hakemus_id hakemus-id :field_id field-id}]
    (if attachment-version
      (->> (assoc params :version attachment-version)
           (exec :hakija-db hakija-queries/download-attachment-version))
      (exec :hakija-db hakija-queries/download-attachment params))))

(defn download-attachment [hakemus-id field-id attachment-version]
  (let [result (->> (query-attachment hakemus-id field-id attachment-version)
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

(defn get-hakemus [hakemus-id]
  (first (exec :hakija-db hakija-queries/get-hakemus {:id hakemus-id})))

(defn get-hakemus-submission [hakemus]
  (first (exec :hakija-db hakija-queries/get-submission {:id (:form_submission_id hakemus)
                                                         :version (:form_submission_version hakemus)})))

(defn update-hakemus-status [hakemus status status-comment identity]
  (let [updated-hakemus (merge hakemus {:status (keyword status)
                                        :status_change_comment status-comment
                                        :user_oid (:person-oid identity)
                                        :user_first_name (:first-name identity)
                                        :user_last_name (:surname identity)
                                        :user_email (:email identity)
                                        :avustushaku_id (:avustushaku hakemus)})]
    (exec-all :hakija-db [hakija-queries/lock-hakemus hakemus
                          hakija-queries/close-existing-hakemus! hakemus
                          hakija-queries/update-hakemus-status<! updated-hakemus])))

(defn list-hakemus-change-requests [hakemus-id]
  (hakemukset->json (exec :hakija-db hakija-queries/list-hakemus-change-requests {:id hakemus-id})))
