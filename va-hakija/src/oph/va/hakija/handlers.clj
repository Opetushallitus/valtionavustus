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
            [oph.va.hakija.email :as va-email]))

(defn- hakemus-conflict-response [hakemus]
  (conflict! {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
              :status (:status hakemus)
              :version (:version hakemus)
              :last-status-change-at (:last_status_change_at hakemus)}))

(defn- get-open-avustushaku [haku-id hakemus]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        phase (avustushaku-phase avustushaku)]
    (if (or (= phase "current") (= (:status hakemus) "pending_change_request"))
      avustushaku
      (method-not-allowed! {:phase phase}))))

(defn- hakemus-ok-response [hakemus submission validation]
  (ok {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
       :status (:status hakemus)
       :status-comment (:status_change_comment hakemus)
       :register-number (:register_number hakemus)
       :version (:version hakemus)
       :last-status-change-at (:last_status_change_at hakemus)
       :submission submission
       :validation-errors validation}))

(defn on-hakemus-create [haku-id answers]
  (let [avustushaku (get-open-avustushaku haku-id {})
        avustushaku-content (:content avustushaku)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        security-validation (validation/validate-form-security form answers)]
    (if (every? empty? (vals security-validation))
      (if-let [new-hakemus (va-db/create-hakemus! haku-id form-id answers)]
        ;; TODO: extract
        (let [validation (validation/validate-form form answers {})
              language (keyword (find-answer-value answers "language"))
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
            (hakemus-ok-response (:hakemus new-hakemus) (:submission new-hakemus) validation))
        (internal-server-error!))
      (bad-request! security-validation))))

(defn on-get-current-answers [haku-id hakemus-id]
  (let [form-id (:form (va-db/get-avustushaku haku-id))
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
          (va-submit-notification/send-submit-notifications! va-email/send-hakemus-submitted-message! answers submitted-hakemus avustushaku)
          (hakemus-ok-response submitted-hakemus saved-submission validation))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-hakemus-change-request-response [haku-id hakemus-id base-version answers]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        avustushaku (get-open-avustushaku haku-id hakemus)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
        validation (validation/validate-form form answers attachments)]
    (if (every? empty? (vals validation))
      (if (= base-version (:version hakemus))
        (let [submission-id (:form_submission_id hakemus)
              saved-submission (:body (update-form-submission form-id submission-id answers))
              submission-version (:version saved-submission)]
          (va-db/submit-hakemus haku-id
                                hakemus-id
                                submission-id
                                submission-version
                                (:register_number hakemus)
                                answers)
          (method-not-allowed! {:change-request-response "saved"}))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-attachment-list [haku-id hakemus-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (va-db/get-attachments hakemus-id (:id hakemus))))

(defn on-attachment-create [haku-id hakemus-id hakemus-base-version field-id filename content-type size tempfile]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if-let [attachment (va-db/create-attachment (:id hakemus)
                                                 hakemus-base-version
                                                 field-id
                                                 filename
                                                 content-type
                                                 size
                                                 tempfile)]
      (ok (va-db/convert-attachment hakemus-id attachment))
      (bad-request {:error true}))
    (bad-request! {:error true})))

(defn on-attachment-delete [haku-id hakemus-id field-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if (va-db/attachment-exists? (:id hakemus) field-id)
      (do (va-db/close-existing-attachment! (:id hakemus) field-id)
          (ok))
      (not-found))))

(defn on-attachment-get [haku-id hakemus-id field-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if (va-db/attachment-exists? (:id hakemus) field-id)
      (let [{:keys [data size filename content-type]} (va-db/download-attachment (:id hakemus) field-id)]
        (-> (ok data)
            (assoc-in [:headers "Content-Type"] content-type)
            (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"" filename "\""))))
      (not-found))))
