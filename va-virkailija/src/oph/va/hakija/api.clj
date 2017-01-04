(ns oph.va.hakija.api
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:require [clojure.java.io :as io]
            [oph.soresu.common.db :refer :all]
            [oph.soresu.form.formhandler :as formhandler]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.routes :refer :all]
            [clojure.tools.logging :as log]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.virkailija.email :as email]
            [oph.common.datetime :as datetime])
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
       (exec :form-db hakija-queries/health-check)
       first
       :?column?
       (= 1)))

(defn create-avustushaku [avustushaku-content template-form-id decision]
  (let [form-id (:id (exec :form-db
                           hakija-queries/copy-form<!
                           {:id template-form-id}))
        avustushaku-id (exec :form-db
                              hakija-queries/create-avustushaku<!
                              {:form form-id
                               :content avustushaku-content
                               :decision decision
                               :register_number nil})]
    (->> avustushaku-id
         (exec :form-db hakija-queries/get-avustushaku)
         (map avustushaku-response-content)
         first)))

(defn update-avustushaku [avustushaku]
  (let [haku-status (if (= (:status avustushaku) "new")
                      (new HakuStatus "draft")
                      (new HakuStatus (:status avustushaku)))
        avustushaku-to-save (-> (assoc avustushaku :status haku-status)
                                (assoc :register_number (:register-number avustushaku))
                                (assoc :is_academysize (:is_academysize avustushaku))
                                (assoc :multiple_rahoitusalue (:multiple-rahoitusalue avustushaku)))]
    (exec-all :form-db
              [hakija-queries/archive-avustushaku! avustushaku-to-save
               hakija-queries/update-avustushaku! avustushaku-to-save])
    (->> avustushaku-to-save
         (exec :form-db hakija-queries/get-avustushaku)
         (map avustushaku-response-content)
         first)))

(defn get-avustushaku [id]
  (first (exec :form-db hakija-queries/get-avustushaku {:id id})))

(defn list-avustushaut []
  (map avustushaku-response-content (exec :form-db hakija-queries/list-avustushaut-not-deleted {})))

(defn- map-status-list [statuses]
  (map (fn [status] (new HakuStatus status)) statuses))

(defn list-avustushaut-by-status [statuses]
  (if statuses
    (map avustushaku-response-content (exec :form-db hakija-queries/list-avustushaut-by-status {:statuses (map-status-list statuses)}))
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
        role-id (exec :form-db hakija-queries/create-avustushaku-role<! role-to-save)]
    (->> role-id
         (exec :form-db hakija-queries/get-avustushaku-role)
         (map role->json)
         first)))

(defn delete-avustushaku-role [avustushaku-id role-id]
 (exec :form-db hakija-queries/delete-avustushaku-role! {:avustushaku avustushaku-id
                                                           :id role-id}))

(defn update-avustushaku-role [avustushaku-id role]
  (let [role-enum (new HakuRole (:role role))
        role-to-save (assoc (assoc role :role role-enum) :avustushaku avustushaku-id)]
    (exec :form-db hakija-queries/update-avustushaku-role! role-to-save)
    (->> role-to-save
       (exec :form-db hakija-queries/get-avustushaku-role)
         (map role->json)
         first)))

(defn get-avustushaku-roles [avustushaku-id]
  (roles->json (exec :form-db hakija-queries/get-avustushaku-roles {:avustushaku_id avustushaku-id})))

(defn- form->json [form]
  (let [form-for-rendering (formhandler/add-koodisto-values :form-db form)]
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
   :selvitys-email (:selvitys_email hakemus)
   :status-loppuselvitys (:status_loppuselvitys hakemus)
   :status-valiselvitys (:status_valiselvitys hakemus)
   :answers (:answer_values hakemus)})

(defn- paatos-sent-emails->json [paatos]
  {:id (:id paatos)
   :version (:version paatos)
   :project-name (:project_name paatos)
   :organization-name (:organization_name paatos)
   :sent-emails (:sent_emails paatos)
   :view_count (:view_count paatos)
   :user_key (:user_key paatos)
   :sent-time (:sent_time paatos)})

(defn- hakemukset->json [hakemukset]
  (map hakemus->json hakemukset))

(defn- convert-attachment-group [group]
  (let [id (-> group first :hakemus_id)]
    [id (attachments->map group)]))

(defn get-form-by-avustushaku [avustushaku-id]
  (first (exec :form-db hakija-queries/get-form-by-avustushaku {:avustushaku_id avustushaku-id})))

(defn get-form-by-id [id]
  (first (exec :form-db hakija-queries/get-form-by-id {:id id})))

(defn get-avustushaku [avustushaku-id]
  (first (exec :form-db hakija-queries/get-avustushaku {:id avustushaku-id})))

(defn get-avustushaku-by-status [avustushaku-id statuses]
  (first (exec :form-db hakija-queries/get-avustushaku-by-status {:id avustushaku-id :statuses (map-status-list statuses)})))

(defn get-paatos-email-status [avustushaku-id]
  (let [paatos-sent-emails (exec :form-db hakija-queries/list-hakemus-paatos-email-statuses {:avustushaku_id avustushaku-id})]
    (map paatos-sent-emails->json paatos-sent-emails)))

(defn find-paatos-views [hakemus-id]
  (exec :form-db hakija-queries/find-paatos-views {:hakemus_id hakemus-id}))

(defn add-paatos-sent-emails [hakemus emails decision]
  (exec :form-db hakija-queries/add-hakemus-paatos! {:hakemus_id (:id hakemus)
                                                         :hakemus_version (:version hakemus)
                                                         :decision decision
                                                         :sent_emails {:addresses emails}}))


(defn find-regenerate-hakemus-paatos-ids [avustushaku-id]
  (exec :form-db hakija-queries/regenerate-hakemus-paatos-ids {:avustushaku_id avustushaku-id}))

(defn update-paatos-decision [hakemus-id decision]
  (exec :form-db hakija-queries/update-hakemus-paatos-decision! {:hakemus_id hakemus-id
                                                     :decision decision}))

(defn get-hakemukset [avustushaku-id]
  (exec :form-db hakija-queries/list-hakemukset-by-avustushaku {:avustushaku_id avustushaku-id}))

(defn get-hakudata [avustushaku-id]
  (let [avustushaku (get-avustushaku avustushaku-id)
        form (get-form-by-avustushaku avustushaku-id)
        roles (get-avustushaku-roles avustushaku-id)
        hakemukset (exec :form-db hakija-queries/list-hakemukset-by-avustushaku {:avustushaku_id avustushaku-id})
        attachments (exec :form-db hakija-queries/list-attachments-by-avustushaku {:avustushaku_id avustushaku-id})]
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


(defn get-selvitysdata [avustushaku-id hakemus-id]
  (let [avustushaku (get-avustushaku avustushaku-id)
        loppuselvitys-form-id (:form_loppuselvitys avustushaku)
        loppuselvitys-form (get-form-by-id loppuselvitys-form-id)
        loppuselvitys (first (exec :form-db hakija-queries/get-by-type-and-parent-id {:parent_id hakemus-id :hakemus_type "loppuselvitys"}))
        valiselvitys-form-id (:form_valiselvitys avustushaku)
        valiselvitys-form (get-form-by-id valiselvitys-form-id)
        valiselvitys (first (exec :form-db hakija-queries/get-by-type-and-parent-id {:parent_id hakemus-id :hakemus_type "valiselvitys"}))
        attachments (exec :form-db hakija-queries/list-attachments-by-avustushaku {:avustushaku_id avustushaku-id})]
    {
     :loppuselvitysForm (form->json loppuselvitys-form)
     :valiselvitysForm (form->json valiselvitys-form)
     :loppuselvitys (if loppuselvitys (hakemus->json loppuselvitys) {})
     :valiselvitys (if valiselvitys (hakemus->json valiselvitys) {})
     :attachments (->> attachments
                       (partition-by (fn [attachment] (:hakemus_id attachment)))
                       (mapv convert-attachment-group)
                       (into {}))
     }))

(defn send-selvitys [selvitys-email]
  (let [message (:message selvitys-email)]
    (email/send-selvitys! "sami.mensola@reaktor.fi" message)
    )
)

(defn update-selvitys-message [selvitys-email]
  (let [
        hakemus-id (:selvitys-hakemus-id selvitys-email)
        message (:message selvitys-email)
        to (:to selvitys-email)
        subject (:subject selvitys-email)
        today-date (datetime/date-string (datetime/now))
        email {:message message
               :subject subject
               :send today-date
               :to to
               }
        ]
    (exec :form-db hakija-queries/update-hakemus-selvitys-email! {:selvitys_email email :id hakemus-id})))


(defn update-loppuselvitys-status [hakemus-id status]
  (->> {:id hakemus-id :status status}
       (exec :form-db hakija-queries/update-loppuselvitys-status<! )))

(defn update-valiselvitys-status [hakemus-id status]
  (->> {:id hakemus-id :status status}
       (exec :form-db hakija-queries/update-valiselvitys-status<! )))

(defn get-hakemusdata [hakemus-id]
  (let [hakemus (first (exec :form-db hakija-queries/get-hakemus-with-answers {:id hakemus-id}))
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
       (exec :form-db hakija-queries/list-attachments)))

(defn list-valiselvitys-hakemus-ids [avustushaku_id]
  (->> {:avustushaku_id avustushaku_id}
       (exec :form-db hakija-queries/list-valiselvitys-hakemus-ids)))

(defn list-loppuselvitys-hakemus-ids [avustushaku_id]
  (->> {:avustushaku_id avustushaku_id}
       (exec :form-db hakija-queries/list-loppuselvitys-hakemus-ids)))

(defn list-attachment-versions [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec :form-db hakija-queries/list-attachment-versions)))

(defn attachment-exists? [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec :form-db hakija-queries/attachment-exists?)
       first))

(defn- query-attachment [hakemus-id field-id attachment-version]
  (let [params {:hakemus_id hakemus-id :field_id field-id}]
    (if attachment-version
      (->> (assoc params :version attachment-version)
           (exec :form-db hakija-queries/download-attachment-version))
      (exec :form-db hakija-queries/download-attachment params))))

(defn download-attachment [hakemus-id field-id attachment-version]
  (let [result (->> (query-attachment hakemus-id field-id attachment-version)
                    first)]
    {:data (io/input-stream (:file_data result))
     :content-type (:content_type result)
     :filename (:filename result)
     :size (:file_size result)}))

(defn create-form! [form-content]
  ;; NOTE: looks like yesql unwraps sequence parameters, thats way we wrap them one extra time here
  ;; TODO: Consolidate with oph.soresu.form.db currently in soresu-form
  (let [params {:content (list (:content form-content)) :rules (list (:rules form-content))}]
    (exec :form-db hakija-queries/create-form<! params)))


(defn- update-form! [form-id form-content]
  ;; NOTE: looks like yesql unwraps sequence parameters, thats way we wrap them one extra time here
  ;; TODO: Consolidate with oph.soresu.form.db currently in soresu-form
  (let [params {:form_id form-id :content (list (:content form-content)) :rules (list (:rules form-content))}]
    (exec-all :form-db [hakija-queries/archive-form! { :form_id form-id }
                          hakija-queries/update-form! params])))

(defn update-form-by-avustushaku [avustushaku-id form]
  (let [form-id (-> avustushaku-id
                    (get-form-by-avustushaku)
                    :id)
        form-to-save (assoc form :form_id form-id)]
    (try (update-form! form-id form-to-save)
         (catch Exception e (throw (get-next-exception-or-original e))))
    (get-form-by-avustushaku avustushaku-id)))

(defn update-avustushaku-form-loppuselvitys [avustushaku-id form-id]
  (exec :form-db hakija-queries/update-form-loppuselvitys! {:id avustushaku-id :form_loppuselvitys form-id}))

(defn update-avustushaku-form-valiselvitys [avustushaku-id form-id]
  (exec :form-db hakija-queries/update-form-valiselvitys! {:id avustushaku-id :form_valiselvitys form-id}))

(defn create-form [form-content]
  (let [form (create-form! form-content)
        form-id (:id form)]
    (get-form-by-id form-id)))

(defn update-form  [form-id form]
  (let [form-to-save (assoc form :form_id form-id)]
    (try (update-form! form-id form-to-save)
         (catch Exception e (throw (get-next-exception-or-original e))))
    (get-form-by-id form-id)))

(defn get-hakemus [hakemus-id]
  (first (exec :form-db hakija-queries/get-hakemus {:id hakemus-id})))


(defn get-hakemus-by-user-key [user-key]
  (first (exec :form-db hakija-queries/get-hakemus-by-user-key {:user_key user-key})))

(defn get-hakemus-submission [hakemus]
  (first (exec :form-db hakija-queries/get-submission {:id (:form_submission_id hakemus)
                                                         :version (:form_submission_version hakemus)})))

(defn update-hakemus-status [hakemus status status-comment identity]
  (let [updated-hakemus (merge hakemus {:status (keyword status)
                                        :status_change_comment status-comment
                                        :user_oid (:person-oid identity)
                                        :user_first_name (:first-name identity)
                                        :user_last_name (:surname identity)
                                        :user_email (:email identity)
                                        :avustushaku_id (:avustushaku hakemus)})]
    (exec-all :form-db [hakija-queries/lock-hakemus hakemus
                          hakija-queries/close-existing-hakemus! hakemus
                          hakija-queries/update-hakemus-status<! updated-hakemus])))

(defn list-hakemus-change-requests [hakemus-id]
  (hakemukset->json (exec :form-db hakija-queries/list-hakemus-change-requests {:id hakemus-id})))
