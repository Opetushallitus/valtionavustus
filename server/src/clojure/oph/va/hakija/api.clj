(ns oph.va.hakija.api
  (:use [clojure.data :as data])
  (:require
   [clj-time.core :as clj-time]
   [clojure.java.io :as io]
   [clojure.tools.logging :as log]
   [oph.common.datetime :as datetime]
   [oph.soresu.common.db :refer [escape-like-pattern exec execute!
                                 get-next-exception-or-original with-transaction with-tx]]
   [oph.soresu.form.db :refer [update-form!]]
   [oph.soresu.form.formhandler :as formhandler]
   [oph.va.environment :as environment]
   [oph.va.hakemus.db :as hakemus-copy]
   [oph.va.hakija.api.queries :as hakija-queries]
   [oph.va.hakija.db :refer [get-hakemus-by-id-tx]]
   [oph.va.hakija.domain :as hakija-domain]
   [oph.va.hakija.jotpa :refer [is-jotpa-avustushaku]]
   [oph.va.jdbc.enums]
   [oph.va.menoluokka.db :refer [upsert-menoluokka-rows]]
   [oph.va.routes :refer :all]
   [oph.va.virkailija.authorization :as authorization]
   [oph.va.virkailija.email :as email]
   [ring.util.http-response :refer [conflict! ok]])
  (:import
   (oph.va.jdbc.enums HakuRole HakuStatus HakuType)))

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

(defn- copy-form [tx id created-at]
  (:id (hakija-queries/copy-form<! {:id id :created_at created-at} {:connection tx})))

(defn create-avustushaku [tx avustushaku-content template-form-id loppuselvitys-id valiselvitys-id decision haku-type operational-unit-id muutoshakukelpoinen created-at]
  (let [created-timestamp    (datetime/datetime->str created-at)
        form-id              (copy-form tx template-form-id created-timestamp)
        new-loppuselvitys-id (when loppuselvitys-id
                               (copy-form tx loppuselvitys-id created-timestamp))
        new-valiselvitys-id  (when valiselvitys-id
                               (copy-form tx valiselvitys-id created-timestamp))
        avustushaku-id       (hakija-queries/create-avustushaku<!
                              {:form form-id
                               :content avustushaku-content
                               :haku_type (new HakuType haku-type)
                               :register_number nil
                               :decision decision
                               :operational_unit_id operational-unit-id
                               :form_loppuselvitys new-loppuselvitys-id
                               :form_valiselvitys new-valiselvitys-id
                               :muutoshakukelpoinen muutoshakukelpoinen
                               :created_at (datetime/datetime->str created-at)}
                              {:connection tx})]
    (->> (hakija-queries/get-avustushaku avustushaku-id {:connection tx})
         (map avustushaku-response-content)
         first)))

(defn get-hakemus [hakemus-id]
  (first (exec hakija-queries/get-hakemus {:id hakemus-id})))

(defn get-hakemus-by-user-key [user-key]
  (first (exec hakija-queries/get-hakemus-by-user-key {:user_key user-key})))

(defn get-hakemus-submission [hakemus]
  (first (exec hakija-queries/get-submission {:id (:form_submission_id hakemus)
                                              :version (:form_submission_version hakemus)})))

(defn diff-paatos [old new]
  (data/diff (dissoc old :updatedAt)
             (dissoc new :updatedAt)))

(defn update-avustushaku [avustushaku]
  (let [haku-status (if (= (:status avustushaku) "new")
                      (new HakuStatus "draft")
                      (new HakuStatus (:status avustushaku)))
        content (hakija-domain/cleanup-avustushaku-content (:content avustushaku))
        avustushaku-to-save (assoc avustushaku
                                   :status haku-status
                                   :content content
                                   :register_number (:register-number avustushaku)
                                   :hallinnoiavustuksia_register_number (:hallinnoiavustuksia-register-number avustushaku)
                                   :is_academysize (:is_academysize avustushaku)
                                   :haku_type (new HakuType (:haku-type avustushaku))
                                   :hankkeen_alkamispaiva (:hankkeen-alkamispaiva avustushaku)
                                   :hankkeen_paattymispaiva (:hankkeen-paattymispaiva avustushaku)
                                   :operational_unit_id (:operational-unit-id avustushaku))]

    (with-transaction connection
      (let [db-options {:connection connection}
            previous-avustushaku-version (hakija-queries/archive-avustushaku<! avustushaku-to-save db-options)
            previous-paatos-version (:decision previous-avustushaku-version)
            new-paatos-version (:decision avustushaku)
            diff-result (diff-paatos previous-paatos-version new-paatos-version)]
        (if (and (= nil (first diff-result)) (= nil (first (rest diff-result))))
          (hakija-queries/update-avustushaku! avustushaku-to-save db-options)
          (let [updated-paatos (merge new-paatos-version {:updatedAt (clj-time/now)})
                avustushaku-with-updated-decision (merge avustushaku-to-save {:decision updated-paatos})]
            (hakija-queries/update-avustushaku! avustushaku-with-updated-decision db-options)))))
    (->> avustushaku-to-save
         (exec hakija-queries/get-avustushaku)
         (map avustushaku-response-content)
         first)))

(defn get-avustushaku [id]
  (first (exec hakija-queries/get-avustushaku {:id id})))

(defn- map-status-list [statuses]
  (map (fn [status] (new HakuStatus status)) statuses))

(defn get-avustushaku-by-status [avustushaku-id statuses]
  (first (exec hakija-queries/get-avustushaku-by-status {:id avustushaku-id :statuses (map-status-list statuses)})))

(defn list-avustushaut []
  (map avustushaku-response-content
       (exec hakija-queries/list-avustushaut-not-deleted {})))

(defn list-avustushaut-by-status [statuses]
  (if statuses
    (map avustushaku-response-content
         (exec hakija-queries/list-avustushaut-by-status
               {:statuses (map-status-list statuses)}))
    (list-avustushaut)))

(defn- role->json [role]
  {:id (:id role)
   :name (:name role)
   :email (:email role)
   :role (:role role)
   :oid (:oid role)})

(defn- change-existing-vastuuvalmistelija-to-valmistelija [tx avustushaku-id]
  (execute! tx
            "UPDATE hakija.avustushaku_roles SET role = 'presenting_officer'
             WHERE avustushaku = ? AND role = 'vastuuvalmistelija'"
            [avustushaku-id]))

(defn create-avustushaku-role [tx role]
  (let [role-enum (new HakuRole (:role role))
        role-to-save (assoc role :role role-enum)
        delete (when (= (:role role) "vastuuvalmistelija") (change-existing-vastuuvalmistelija-to-valmistelija tx (:avustushaku role)))
        role-id (hakija-queries/create-avustushaku-role<! role-to-save {:connection tx})]
    (->> (hakija-queries/get-avustushaku-role role-id {:connection tx})
         (map role->json)
         first)))

(defn delete-avustushaku-role [avustushaku-id role-id]
  (exec hakija-queries/delete-avustushaku-role! {:avustushaku avustushaku-id :id role-id}))

(defn update-avustushaku-role [tx avustushaku-id role]
  (let [role-enum (new HakuRole (:role role))
        role-to-save (assoc (assoc role :role role-enum) :avustushaku avustushaku-id)
        delete (when (= (:role role) "vastuuvalmistelija") (change-existing-vastuuvalmistelija-to-valmistelija tx avustushaku-id))]
    (execute! tx
              "UPDATE hakija.avustushaku_roles
               SET avustushaku = ?, role = ?, name = ?, email = ?
               WHERE id = ?"
              [avustushaku-id role-enum (:name role) (:email role) (:id role)])
    (->> role-to-save
         (exec hakija-queries/get-avustushaku-role)
         (map role->json)
         first)))

(defn get-avustushaku-roles [avustushaku-id]
  (->> {:avustushaku_id avustushaku-id}
       (exec hakija-queries/get-avustushaku-roles)
       (map role->json)))

(defn get-avustushaku-role-by-avustushaku-id-and-person-oid [avustushaku-id person-oid]
  (->> {:avustushaku_id avustushaku-id
        :oid            person-oid}
       (exec hakija-queries/get-avustushaku-role-by-avustushaku-id-and-person-oid)
       (map role->json)
       first))

(defn get-avustushaku-role-by-avustushaku-id-and-person-oid-tx [tx avustushaku-id person-oid]
  (->> [avustushaku-id person-oid]
       (execute! tx "select * from avustushaku_roles where avustushaku = ? and oid = ?")
       (map role->json)
       first))

(defn form->json [form]
  (let [form-for-rendering (formhandler/add-koodisto-values form)]
    {:content (:content form-for-rendering)
     :rules (:rules form-for-rendering)}))

(defn- hakemus->json [hakemus]
  {:id (:id hakemus)
   :version (:version hakemus)
   :version-date (:created_at hakemus)
   :project-name (:project_name hakemus)
   :language (:language hakemus)
   :organization-name (:organization_name hakemus)
   :budget-oph-share (:budget_oph_share hakemus)
   :budget-total (:budget_total hakemus)
   :status (:status hakemus)
   :status-comment (:status_change_comment hakemus)
   :user-first-name (:user_first_name hakemus)
   :user-last-name (:user_last_name hakemus)
   :user-oid (:user_oid hakemus)
   :register-number (:register_number hakemus)
   :user-key (:user_key hakemus)
   :selvitys-email (:selvitys_email hakemus)
   :status-loppuselvitys (:status_loppuselvitys hakemus)
   :loppuselvitys-information-verified-by (:loppuselvitys_information_verified_by hakemus)
   :loppuselvitys-information-verified-at (:loppuselvitys_information_verified_at hakemus)
   :loppuselvitys-information-verification (:loppuselvitys_information_verification hakemus)
   :loppuselvitys-taloustarkastanut-name (:loppuselvitys_taloustarkastanut_name hakemus)
   :loppuselvitys-taloustarkastettu-at (:loppuselvitys_taloustarkastettu_at hakemus)
   :status-valiselvitys (:status_valiselvitys hakemus)
   :status-muutoshakemus (:status_muutoshakemus hakemus)
   :answers (:answer_values hakemus)
   :refused (get hakemus :refused false)
   :refused-comment (:refused_comment hakemus)
   :refused-at (:refused_at hakemus)
   :keskeytetty-aloittamatta (:keskeytetty_aloittamatta hakemus)
   :submitted-version (:submitted_version hakemus)
   :loppuselvitys-change-request-pending (:loppuselvitys_change_request_pending hakemus)
   :loppuselvitys-change-request-sent (:loppuselvitys_change_request_sent hakemus)})

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
  (first (exec hakija-queries/get-form-by-avustushaku {:avustushaku_id avustushaku-id})))

(defn get-form-by-id [id]
  (first (exec hakija-queries/get-form-by-id {:id id})))

(defn get-paatos-email-status [avustushaku-id]
  (let [paatos-sent-emails (exec hakija-queries/list-hakemus-paatos-email-statuses {:avustushaku_id avustushaku-id})]
    (map paatos-sent-emails->json paatos-sent-emails)))

(defn find-paatos-views [hakemus-id]
  (exec hakija-queries/find-paatos-views {:hakemus_id hakemus-id}))

(defn add-paatos-sent-emails [hakemus emails decision]
  (exec hakija-queries/add-hakemus-paatos! {:hakemus_id (:id hakemus)
                                            :hakemus_version (:version hakemus)
                                            :decision decision
                                            :sent_emails {:addresses emails}}))

(defn update-paatos-sent-emails [hakemus emails decision]
  (exec hakija-queries/update-hakemus-paatos! {:hakemus_id (:id hakemus)
                                               :hakemus_version (:version hakemus)
                                               :decision decision
                                               :sent_emails {:addresses emails}}))

(defn find-regenerate-hakemus-paatos-ids [avustushaku-id]
  (exec hakija-queries/regenerate-hakemus-paatos-ids {:avustushaku_id avustushaku-id}))

(defn update-paatos-decision [hakemus-id decision]
  (exec hakija-queries/update-hakemus-paatos-decision! {:hakemus_id hakemus-id
                                                        :decision decision}))

(defn get-hakudata [avustushaku-id]
  (when-let [avustushaku (get-avustushaku avustushaku-id)]
    (let [form (get-form-by-avustushaku avustushaku-id)
          roles (get-avustushaku-roles avustushaku-id)
          hakemukset (exec hakija-queries/list-hakemukset-by-avustushaku {:avustushaku_id avustushaku-id})
          attachments (exec hakija-queries/list-attachments-by-avustushaku {:avustushaku_id avustushaku-id})]
      {:avustushaku (avustushaku-response-content avustushaku)
       :environment (environment/get-content)
       :roles roles
       :form (form->json form)
       :hakemukset (hakemukset->json hakemukset)
       :attachments (->> attachments
                         (partition-by (fn [attachment] (:hakemus_id attachment)))
                         (mapv convert-attachment-group)
                         (into {}))
       :budget-total-sum (reduce + (map :budget_total hakemukset))
       :budget-oph-share-sum (reduce + (map :budget_oph_share hakemukset))})))

(defn get-hakemukset-for-export [hakemus-type avustushaku-id]
  (->> {:hakemus_type hakemus-type :avustushaku_id avustushaku-id}
       (exec hakija-queries/list-hakemukset-for-export-by-type-and-avustushaku)
       hakemukset->json))

(defn list-hakemus-change-requests [hakemus-id]
  (hakemukset->json (exec hakija-queries/list-hakemus-change-requests {:id hakemus-id})))

(defn get-selvitysdata [avustushaku-id hakemus-id]
  (let [avustushaku (get-avustushaku avustushaku-id)
        loppuselvitys-form-id (:form_loppuselvitys avustushaku)
        loppuselvitys-form (get-form-by-id loppuselvitys-form-id)
        loppuselvitys (first (exec hakija-queries/get-by-type-and-parent-id {:parent_id hakemus-id :hakemus_type "loppuselvitys"}))
        loppuselvitys-change-requests (list-hakemus-change-requests (:id loppuselvitys))
        valiselvitys-form-id (:form_valiselvitys avustushaku)
        valiselvitys-form (get-form-by-id valiselvitys-form-id)
        valiselvitys (first (exec hakija-queries/get-by-type-and-parent-id {:parent_id hakemus-id :hakemus_type "valiselvitys"}))
        attachments (exec hakija-queries/list-attachments-by-avustushaku {:avustushaku_id avustushaku-id})]
    {:loppuselvitysForm (form->json loppuselvitys-form)
     :valiselvitysForm (form->json valiselvitys-form)
     :loppuselvitys (if loppuselvitys (hakemus->json loppuselvitys) {})
     :loppuselvitysChangeRequests loppuselvitys-change-requests
     :valiselvitys (if valiselvitys (hakemus->json valiselvitys) {})
     :attachments (->> attachments
                       (partition-by (fn [attachment] (:hakemus_id attachment)))
                       (mapv convert-attachment-group)
                       (into {}))}))

(defn update-selvitys-message [selvitys-email]
  (let [hakemus-id (:selvitys-hakemus-id selvitys-email)
        message (:message selvitys-email)
        to (:to selvitys-email)
        subject (:subject selvitys-email)
        today-date (datetime/date-string (datetime/now))
        email {:message message
               :subject subject
               :send today-date
               :to to}]

    (exec hakija-queries/update-hakemus-selvitys-email! {:selvitys_email email :id hakemus-id})))

(defn update-loppuselvitys-status [hakemus-id status]
  (->> {:id hakemus-id :status status}
       (exec hakija-queries/update-loppuselvitys-status<!)))

(defn update-valiselvitys-status [hakemus-id status]
  (->> {:id hakemus-id :status status}
       (exec hakija-queries/update-valiselvitys-status<!)))

(defn set-selvitys-accepted [selvitys-type selvitys-email identity]
  (let [validated-email         (assoc selvitys-email :to (distinct (:to selvitys-email)))
        selvitys-hakemus-id     (:selvitys-hakemus-id selvitys-email)
        hakemus                 (get-hakemus selvitys-hakemus-id)
        avustushaku             (get-avustushaku (:avustushaku hakemus))
        is-jotpa-hakemus        (is-jotpa-avustushaku avustushaku)
        parent-id               (:parent_id hakemus)
        parent-hakemus          (get-hakemus parent-id)
        is-loppuselvitys        (= selvitys-type "loppuselvitys")
        is-verified             (= (:status_loppuselvitys parent-hakemus) "information_verified")
        verifier                (str (:first-name identity) " " (:surname identity))
        verifier-oid            (:person-oid identity)
        can-set-selvitys        (or (not is-loppuselvitys) is-verified)]
    (if can-set-selvitys
      (do
        (email/send-selvitys! (:to validated-email) hakemus (:subject validated-email) (:message validated-email) is-jotpa-hakemus)
        (update-selvitys-message validated-email)
        (if is-loppuselvitys
          (do
            (update-loppuselvitys-status parent-id "accepted")
            (execute!
             "UPDATE hakemukset
               SET
                 loppuselvitys_taloustarkastanut_oid = ?,
                 loppuselvitys_taloustarkastanut_name = ?,
                 loppuselvitys_taloustarkastettu_at = now()
               WHERE id = ? and version_closed is null"
             [verifier-oid verifier parent-id]))
          (update-valiselvitys-status parent-id "accepted"))
        true)
      false)))

(defn verify-loppuselvitys-information [hakemus-id verify-information identity]
  (try (with-tx
         (fn [tx]
           (let [hakemus  (get-hakemus-by-id-tx tx hakemus-id)
                 role     (get-avustushaku-role-by-avustushaku-id-and-person-oid-tx tx  (:avustushaku hakemus) (:person-oid identity))
                 allowed-to-verify (or (authorization/is-pääkäyttäjä? identity) (authorization/is-valmistelija? role))
                 status   (:status-loppuselvitys hakemus)
                 message  (:message verify-information)
                 verifier (str (:first-name identity) " " (:surname identity))]
             (when (and (= status "submitted") allowed-to-verify)
               (execute!
                tx
                "UPDATE hakemukset
           SET
             status_loppuselvitys = 'information_verified',
             loppuselvitys_information_verification = ?,
             loppuselvitys_information_verified_by = ?,
             loppuselvitys_information_verified_at = now()
           WHERE id = ? and version_closed is null"
                [message verifier hakemus-id])
               (ok
                {:loppuselvitys-information-verified-by verifier
                 :loppuselvitys-information-verification message})))))
       (catch java.sql.BatchUpdateException e
         (log/warn {:error (ex-message (ex-cause e))
                    :in "verify-loppuselvitys-information"
                    :hakemus-id hakemus-id})
         (conflict!))))

(defn get-hakemusdata [hakemus-id]
  (let [hakemus (first (exec hakija-queries/get-hakemus-with-answers {:id hakemus-id}))
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
       (exec hakija-queries/list-attachments)))

(defn list-valiselvitys-hakemus-ids [avustushaku_id]
  (->> {:avustushaku_id avustushaku_id}
       (exec hakija-queries/list-valiselvitys-hakemus-ids)))

(defn list-loppuselvitys-hakemus-ids [avustushaku_id]
  (->> {:avustushaku_id avustushaku_id}
       (exec hakija-queries/list-loppuselvitys-hakemus-ids)))

(defn list-attachment-versions [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec hakija-queries/list-attachment-versions)))

(defn attachment-exists? [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec hakija-queries/attachment-exists?)
       first))

(defn- query-attachment [hakemus-id field-id attachment-version]
  (let [params {:hakemus_id hakemus-id :field_id field-id}]
    (if attachment-version
      (->> (assoc params :version attachment-version)
           (exec hakija-queries/download-attachment-version))
      (exec hakija-queries/download-attachment params))))

(defn download-attachment [hakemus-id field-id attachment-version]
  (let [result (->> (query-attachment hakemus-id field-id attachment-version)
                    first)]
    {:data (io/input-stream (:file_data result))
     :content-type (:content_type result)
     :filename (:filename result)
     :size (:file_size result)}))

(defn create-form! [form-content created-at]
  ;; NOTE: looks like yesql unwraps sequence parameters, thats way we wrap them one extra time here
  ;; TODO: Consolidate with oph.soresu.form.db currently in soresu-form
  (let [params {:content (list (:content form-content))
                :rules (list (:rules form-content))
                :created_at (datetime/datetime->str created-at)}]
    (exec hakija-queries/create-form<! params)))

(defn update-form-by-avustushaku [avustushaku-id form]
  (let [form-id (-> avustushaku-id
                    (get-form-by-avustushaku)
                    :id)
        form-to-save (assoc form :id form-id)]
    (try (with-tx (fn [tx] (update-form! tx form-to-save)
                    (upsert-menoluokka-rows tx avustushaku-id form-to-save)))
         (catch Exception e (throw (get-next-exception-or-original e))))
    (get-form-by-avustushaku avustushaku-id)))

(defn update-avustushaku-form-loppuselvitys [avustushaku-id form-id]
  (exec hakija-queries/update-form-loppuselvitys! {:id avustushaku-id :form_loppuselvitys form-id}))

(defn update-avustushaku-form-valiselvitys [avustushaku-id form-id]
  (exec hakija-queries/update-form-valiselvitys! {:id avustushaku-id :form_valiselvitys form-id}))

(defn create-form [form-content created-at]
  (let [form (create-form! form-content created-at)
        form-id (:id form)]
    (get-form-by-id form-id)))

(defn update-form  [form-id form]
  (let [form-to-save (assoc form :id form-id)]
    (try (with-tx (fn [tx] (update-form! tx form-to-save)))
         (catch Exception e (throw (get-next-exception-or-original e))))
    (get-form-by-id form-id)))

(defn update-hakemus-status [hakemus status status-comment identity]
  (with-tx (fn [tx]
             (let [new-hakemus (hakemus-copy/create-new-hakemus-version tx (:id hakemus))
                   updated-hakemus (merge hakemus {:status (keyword status)
                                                   :version (:version new-hakemus)
                                                   :status_change_comment status-comment
                                                   :user_oid (:person-oid identity)
                                                   :user_first_name (:first-name identity)
                                                   :user_last_name (:surname identity)
                                                   :user_email (:email identity)
                                                   :avustushaku_id (:avustushaku hakemus)})]

               (hakija-queries/update-hakemus-status<! updated-hakemus {:connection tx})))))

(defn find-matching-hakemukset-by-organization-name [organization-name]
  (let [org-pattern (str "%" (escape-like-pattern organization-name) "%")]
    (exec hakija-queries/find-matching-hakemukset-by-organization-name
          {:organization_name org-pattern})))

(defn list-matching-avustushaut-by-ids [ids]
  (exec hakija-queries/list-matching-avustushaut-by-ids {:ids ids}))

(defn listing-avustushaku [avustushakudata]
  (let [avustushaku (avustushaku-response-content avustushakudata)]
    (assoc avustushaku
           :vastuuvalmistelija (:vastuuvalmistelija avustushakudata)
           :paatokset-lahetetty (:paatokset_lahetetty avustushakudata)
           :maksatukset-lahetetty (:maksatukset_lahetetty avustushakudata)
           :valiselvitykset-lahetetty (:valiselvitykset_lahetetty avustushakudata)
           :loppuselvitykset-lahetetty (:loppuselvitykset_lahetetty avustushakudata)
           :arvioitu_maksupaiva (:arvioitu_maksupaiva avustushakudata)
           :maksatukset-summa (:maksatukset_summa avustushakudata)
           :use-overridden-detailed-costs (:use_overridden_detailed_costs avustushakudata))))

(defn get-avustushaut-for-haku-listing []
  (let [data (exec hakija-queries/get-avustushakus-for-listing {})]
    (map listing-avustushaku data)))
