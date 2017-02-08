(ns ^{:skip-aot true} oph.va.hakija.handlers
  (:use [clojure.tools.trace :only [trace]])
  (:require [ring.util.http-response :refer :all]
            [compojure.core :refer [defroutes GET]]
            [compojure.api.sweet :refer :all]
            [ring.swagger.json-schema-dirty]
            [oph.soresu.common.config :refer [config config-simple-name]]
            [oph.common.datetime :as datetime]
            [oph.soresu.form.db :as form-db]
            [oph.soresu.form.validation :as validation]
            [oph.soresu.form.routes :refer :all]
            [oph.soresu.form.formutil :refer :all]
            [oph.va.routes :refer :all]
            [oph.soresu.form.schema :refer :all]
            [oph.va.hakija.db :as va-db]
            [oph.va.hakija.notification-formatter :as va-submit-notification]
            [oph.va.hakija.attachment-validator :as attachment-validator]
            [oph.va.hakija.email :as va-email]
            [ring.util.response :as resp]))

(defn- hakemus-conflict-response [hakemus]
  (conflict! {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
              :status (:status hakemus)
              :version (:version hakemus)
              :version-date (:last_status_change_at hakemus)}))

(defn- get-open-avustushaku [haku-id hakemus]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        phase (avustushaku-phase avustushaku)]
    (if (or (= phase "current") (= (:status hakemus) "pending_change_request") (= (:status hakemus) "officer_edit"))
      avustushaku
      (method-not-allowed! {:phase phase}))))

(defn- hakemus-ok-response [hakemus submission validation]
  (ok {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
       :status (:status hakemus)
       :status-comment (:status_change_comment hakemus)
       :register-number (:register_number hakemus)
       :version (:version hakemus)
       :version-date (:last_status_change_at hakemus)
       :submission (without-id submission)
       :validation-errors validation}))

(defn on-hakemus-create [haku-id answers]
  (let [avustushaku (get-open-avustushaku haku-id {})
        avustushaku-content (:content avustushaku)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        security-validation (validation/validate-form-security form answers)]
    (if (every? empty? (vals security-validation))
      (if-let [new-hakemus (va-db/create-hakemus! haku-id form-id answers "hakemus"  nil)]
        ;; TODO: extract
        (let [validation (validation/validate-form form answers {})
              language (keyword (-> new-hakemus :hakemus :language))
              avustushaku-title (-> avustushaku-content :name language)
              avustushaku-duration (->> avustushaku-content
                                        :duration)
              avustushaku-start-date (->> avustushaku-duration
                                          :start
                                          (datetime/parse))
              avustushaku-end-date (->> avustushaku-duration
                                        :end
                                        (datetime/parse))
              email (find-answer-value answers "primary-email")
              user-key (-> new-hakemus :hakemus :user_key)]
            (va-email/send-new-hakemus-message! language
                                                [email]
                                                haku-id
                                                avustushaku-title
                                                user-key
                                                avustushaku-start-date
                                                avustushaku-end-date)
            (hakemus-ok-response (:hakemus new-hakemus) (without-id (:submission new-hakemus)) validation))
        (internal-server-error!))
      (bad-request! security-validation))))

(defn- ok-id [hakemus]
  (ok {:id (:user_key hakemus)})
)

(defn on-selvitys-init [haku-id hakemus-key selvitys-type]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        form-keyword (keyword (str "form_" selvitys-type))
        form-id (form-keyword avustushaku)
        hakemus (va-db/get-hakemus hakemus-key)
        hakemus-id (:id hakemus)
        existing-selvitys (va-db/find-hakemus-by-parent-id-and-type hakemus-id selvitys-type)
        register-number (:register_number hakemus)]
    (if (nil? existing-selvitys)
      (let [
            new-hakemus-with-submission (va-db/create-hakemus! haku-id form-id {:value [{:key "language", :value (:language hakemus), :fieldType "radioButton"}]} selvitys-type register-number)
            new-hakemus (:hakemus new-hakemus-with-submission)
            new-hakemus-id (:id new-hakemus)
            updated (va-db/update-hakemus-parent-id new-hakemus-id hakemus-id)]
        (ok-id new-hakemus))
      (ok-id existing-selvitys))))

(defn on-get-current-answers [haku-id hakemus-id form-key]
  (let [form-id (form-key (va-db/get-avustushaku haku-id))
        form (form-db/get-form form-id)
        hakemus (va-db/get-hakemus hakemus-id)
        submission-id (:form_submission_id hakemus)
        submission (:body (get-form-submission form-id submission-id))
        submission-version (:version submission)
        answers (:answers submission)
        attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
        validation (validation/validate-form form answers attachments)]
    (if (= (:status hakemus) "new")
      (let [verified-hakemus (va-db/verify-hakemus haku-id
                                                   hakemus-id
                                                   submission-id
                                                   submission-version
                                                   (:register_number hakemus)
                                                   answers)]
        (hakemus-ok-response verified-hakemus submission validation))
      (hakemus-ok-response hakemus submission validation))))

(defn on-hakemus-update [haku-id hakemus-id base-version answers]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        form-id (:form (get-open-avustushaku haku-id hakemus))
        form (form-db/get-form form-id)
        security-validation (validation/validate-form-security form answers)]
    (if (every? empty? (vals security-validation))
      (if (= base-version (:version hakemus))
        (let [attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
              validation (validation/validate-form form answers attachments)
              updated-submission (:body (update-form-submission form-id (:form_submission_id hakemus) answers))
              updated-hakemus (va-db/update-submission haku-id
                                                       hakemus-id
                                                       (:form_submission_id hakemus)
                                                       (:version updated-submission)
                                                       (:register_number hakemus)
                                                       answers)]
          (hakemus-ok-response updated-hakemus updated-submission validation))
        (hakemus-conflict-response hakemus))
      (bad-request! security-validation))))

(defn on-selvitys-update [haku-id hakemus-id base-version answers form-key]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        form-id (form-key (va-db/get-avustushaku haku-id))
        form (form-db/get-form form-id)
        security-validation (validation/validate-form-security form answers)]
    (if (every? empty? (vals security-validation))
      (if (= base-version (:version hakemus))
        (let [attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
              validation (validation/validate-form form answers attachments)
              updated-submission (:body (update-form-submission form-id (:form_submission_id hakemus) answers))
              updated-hakemus (va-db/update-submission haku-id
                                                       hakemus-id
                                                       (:form_submission_id hakemus)
                                                       (:version updated-submission)
                                                       (:register_number hakemus)
                                                       answers)]
          (hakemus-ok-response updated-hakemus updated-submission validation))
        (hakemus-conflict-response hakemus))
      (bad-request! security-validation))))

(defn on-hakemus-submit [haku-id hakemus-id base-version answers]
  (let [avustushaku (get-open-avustushaku haku-id {})
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        hakemus (va-db/get-hakemus hakemus-id)
        attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
        validation (validation/validate-form form answers attachments)]
    (if (every? empty? (vals validation))
      (if (= base-version (:version hakemus))
        (let [submission-id (:form_submission_id hakemus)
              saved-submission (:body (update-form-submission form-id submission-id answers))
              submission-version (:version saved-submission)
              submitted-hakemus (va-db/submit-hakemus haku-id
                                                      hakemus-id
                                                      submission-id
                                                      submission-version
                                                      (:register_number hakemus)
                                                      answers)]
          (va-submit-notification/send-submit-notifications! va-email/send-hakemus-submitted-message! false answers submitted-hakemus avustushaku)
          (hakemus-ok-response submitted-hakemus saved-submission validation))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-selvitys-submit [haku-id hakemus-id base-version answers selvitys-field-keyword selvitys-type]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        form-id (selvitys-field-keyword avustushaku)
        form (form-db/get-form form-id)
        hakemus (va-db/get-hakemus hakemus-id)
        attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
        validation (validation/validate-form form answers attachments)]
    (if (every? empty? (vals validation))
      (if (= base-version (:version hakemus))
        (let [submission-id (:form_submission_id hakemus)
              saved-submission (:body (update-form-submission form-id submission-id answers))
              submission-version (:version saved-submission)
              parent_id (:parent_id hakemus)
              submitted-hakemus (va-db/submit-hakemus haku-id
                                                      hakemus-id
                                                      submission-id
                                                      submission-version
                                                      (:register_number hakemus)
                                                      answers)
              is-loppuselvitys (= selvitys-type "loppuselvitys")
              updated-selvitys-status (if is-loppuselvitys (va-db/update-loppuselvitys-status parent_id "submitted") (va-db/update-valiselvitys-status parent_id "submitted"))]
          (hakemus-ok-response submitted-hakemus saved-submission validation))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-hakemus-change-request-response [haku-id hakemus-id base-version answers]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        avustushaku (get-open-avustushaku haku-id hakemus)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        attachments (va-db/get-attachments hakemus-id (:id hakemus))
        validation (validation/validate-form form answers attachments)]
    (if (every? empty? (vals validation))
      (if (= base-version (:version hakemus))
        (let [submission-id (:form_submission_id hakemus)
              saved-submission (:body (update-form-submission form-id submission-id answers))
              submission-version (:version saved-submission)
              submitted-hakemus (va-db/submit-hakemus haku-id
                                                      hakemus-id
                                                      submission-id
                                                      submission-version
                                                      (:register_number hakemus)
                                                      answers)
              change-requests (va-db/list-hakemus-change-requests hakemus-id)
              email-of-virkailija (:user_email (last change-requests))]
          (if email-of-virkailija
            (va-email/send-change-request-responded-message-to-virkailija! [email-of-virkailija] (:id avustushaku) (-> avustushaku :content :name :fi) (:id submitted-hakemus)))
          (va-submit-notification/send-submit-notifications! va-email/send-hakemus-submitted-message! true answers submitted-hakemus avustushaku)
          (method-not-allowed! {:change-request-response "saved"}))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-hakemus-officer-edit-submit [haku-id hakemus-id base-version answers]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        avustushaku (get-open-avustushaku haku-id hakemus)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        attachments (va-db/get-attachments hakemus-id (:id hakemus))
        validation (validation/validate-form form answers attachments)]
    (if (every? empty? (vals validation))
      (if (= base-version (:version hakemus))
        (let [submission-id (:form_submission_id hakemus)
              saved-submission (:body (update-form-submission form-id submission-id answers))
              submission-version (:version saved-submission)
              submitted-hakemus (va-db/submit-hakemus haku-id
                                                      hakemus-id
                                                      submission-id
                                                      submission-version
                                                      (:register_number hakemus)
                                                      answers)]
          (method-not-allowed! {:officer-edit "saved"}))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-attachment-list [haku-id hakemus-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (va-db/get-attachments hakemus-id (:id hakemus))))

(defn on-attachment-create [haku-id hakemus-id hakemus-base-version field-id filename content-type size tempfile allow-origin]
  (let [real-content-type (attachment-validator/validate-file-content-type tempfile filename content-type)
        hakemus (va-db/get-hakemus hakemus-id)]
    (if hakemus
      (if-let [attachment (va-db/create-attachment (:id hakemus)
                                                   hakemus-base-version
                                                   field-id
                                                   (attachment-validator/file-name-according-to-content-type filename real-content-type)
                                                   real-content-type
                                                   size
                                                   tempfile)]
        (-> (ok (va-db/convert-attachment (:id hakemus) attachment)) (assoc-in [:headers "Access-Control-Allow-Origin"] allow-origin))
        (bad-request {:error true}))
      (bad-request! {:error true}))))

(defn on-attachment-delete [haku-id hakemus-id field-id allow-origin]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if (va-db/attachment-exists? (:id hakemus) field-id)
      (do (va-db/close-existing-attachment! (:id hakemus) field-id)
          (-> (ok) (assoc-in [:headers "Access-Control-Allow-Origin"] allow-origin)))
      (not-found))))

(defn on-attachment-get [haku-id hakemus-id field-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if (va-db/attachment-exists? (:id hakemus) field-id)
      (let [{:keys [data size filename content-type]} (va-db/download-attachment (:id hakemus) field-id)]
        (-> (ok data)
            (assoc-in [:headers "Content-Type"] content-type)
            (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"" filename "\""))))
      (not-found))))
