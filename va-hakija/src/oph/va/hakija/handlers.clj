(ns ^{:skip-aot true} oph.va.hakija.handlers
  (:use [clojure.tools.trace :only [trace]])
  (:require [ring.util.http-response :refer :all]
            [compojure.core :refer [defroutes GET]]
            [compojure.api.sweet :refer :all]
            [ring.swagger.json-schema-dirty]
            [oph.common.config :refer [config config-simple-name]]
            [oph.common.datetime :as datetime]
            [oph.form.db :as form-db]
            [oph.form.validation :as validation]
            [oph.form.routes :refer :all]
            [oph.va.routes :refer :all]
            [oph.form.schema :refer :all]
            [oph.va.hakija.db :as va-db]
            [oph.va.hakija.email :as va-email]))

(defn- matches-key? [key value-container]
  (= (:key value-container) key))

(defn- find-hakemus-value [answers key]
  (->> answers
       :value
       (filter (partial matches-key? key))
       first
       :value))

(defn- hakemus-conflict-response [hakemus]
  (conflict! {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
              :status (:status hakemus)
              :version (:version hakemus)
              :last_status_change_at (:last_status_change_at hakemus)}))

(defn- get-open-avustushaku [haku-id]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        phase (avustushaku-phase avustushaku)]
    (if (= phase "current")
      avustushaku
      (method-not-allowed! {:phase phase}))))

(defn- hakemus-ok-response [hakemus submission validation]
  (ok {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
       :status (:status hakemus)
       :version (:version hakemus)
       :last_status_change_at (:last_status_change_at hakemus)
       :submission submission
       :validation_errors validation}))

(defn on-hakemus-create [haku-id answers]
  (let [avustushaku (get-open-avustushaku haku-id)
        avustushaku-content (:content avustushaku)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        security-validation (validation/validate-form-security form answers)]
    (if (every? empty? (vals security-validation))
      (if-let [new-hakemus (va-db/create-hakemus! haku-id form-id answers)]
        ;; TODO: extract
        (let [validation (validation/validate-form form answers)
              language (keyword (find-hakemus-value answers "language"))
              avustushaku-title (-> avustushaku-content :name language)
              avustushaku-duration (->> avustushaku-content
                                        :duration)
              avustushaku-start-date (->> avustushaku-duration
                                          :start
                                          (datetime/parse))
              avustushaku-end-date (->> avustushaku-duration
                                        :end
                                        (datetime/parse))
              email (find-hakemus-value answers "primary-email")
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
        validation (validation/validate-form form answers)]
    (if (= (:status hakemus) "new")
      (let [verified-hakemus (va-db/verify-hakemus haku-id hakemus-id submission-id submission-version answers)]
        (hakemus-ok-response verified-hakemus submission validation))
      (hakemus-ok-response hakemus submission validation))))

(defn on-hakemus-update [haku-id hakemus-id base-version answers]
  (let [form-id (:form (get-open-avustushaku haku-id))
        form (form-db/get-form form-id)
        security-validation (validation/validate-form-security form answers)]
    (if (every? empty? (vals security-validation))
      (let [hakemus (va-db/get-hakemus hakemus-id)]
        (if (= base-version (:version hakemus))
          (let [validation (validation/validate-form form answers)
                updated-submission (:body (update-form-submission form-id (:form_submission_id hakemus) answers))
                updated-hakemus (va-db/update-submission haku-id
                                                         hakemus-id
                                                         (:form_submission_id hakemus)
                                                         (:version updated-submission)
                                                         answers)]
            (hakemus-ok-response updated-hakemus updated-submission validation))
          (hakemus-conflict-response hakemus)))
      (bad-request! security-validation))))

(defn on-hakemus-submit [haku-id hakemus-id base-version answers]
  (let [avustushaku (get-open-avustushaku haku-id)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        validation (validation/validate-form form answers)]
    (if (every? empty? (vals validation))
      (let [hakemus (va-db/get-hakemus hakemus-id)]
        (if (= base-version (:version hakemus))
          (let [submission-id (:form_submission_id hakemus)
                saved-submission (:body (update-form-submission form-id submission-id answers))
                submission-version (:version saved-submission)
                submitted-hakemus (va-db/submit-hakemus haku-id
                                                        hakemus-id
                                                        submission-id
                                                        submission-version
                                                        answers)
                ;; TODO: extract
                avustushaku-content (:content avustushaku)
                language (keyword (find-hakemus-value answers "language"))
                avustushaku-title (-> avustushaku-content :name language)
                avustushaku-duration (->> avustushaku-content
                                          :duration)
                avustushaku-start-date (->> avustushaku-duration
                                            :start
                                            (datetime/parse))
                avustushaku-end-date (->> avustushaku-duration
                                          :end
                                          (datetime/parse))
                organization-email (find-hakemus-value answers "organization-email")
                primary-email (find-hakemus-value answers "primary-email")
                signature-email (find-hakemus-value answers "signature-email")
                user-key (-> submitted-hakemus :user_key)]
            (va-email/send-hakemus-submitted-message! language
                                                      [primary-email organization-email signature-email]
                                                      haku-id
                                                      avustushaku-title
                                                      user-key
                                                      avustushaku-start-date
                                                      avustushaku-end-date)
            (hakemus-ok-response submitted-hakemus saved-submission validation))
          (hakemus-conflict-response hakemus)))
      (bad-request! validation))))

(defn on-attachment-create [haku-id hakemus-id hakemus-base-version field-id filename content-type size tempfile]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if-let [attachment (va-db/create-attachment (:id hakemus)
                                                 hakemus-base-version
                                                 field-id
                                                 filename
                                                 content-type
                                                 size
                                                 tempfile)]
      (ok {:id (:id attachment)
           :hakemus-id hakemus-id
           :version (:version attachment)
           :field-id (:field_id attachment)
           :file-size (:file_size attachment)
           :content-type (:content_type attachment)
           :hakemus-version (:hakemus_version attachment)
           :filename (:filename attachment)})
      (bad-request {:error true}))
    (bad-request! {:error true})))

(defn on-attachment-delete [haku-id hakemus-id field-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if (va-db/attachment-exists? (:id hakemus) field-id)
      (do (va-db/close-existing-attachment! (:id hakemus) field-id)
          (ok))
      (not-found))))
