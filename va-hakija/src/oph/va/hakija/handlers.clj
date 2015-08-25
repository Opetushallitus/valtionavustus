(ns ^{:skip-aot true} oph.va.hakija.handlers
  (:use [clojure.tools.trace :only [trace]])
  (:require [ring.util.http-response :refer :all]
            [compojure.core :refer [defroutes GET]]
            [compojure.api.sweet :refer :all]
            [oph.common.config :refer [config config-simple-name]]
            [oph.common.datetime :as datetime]
            [oph.form.db :as form-db]
            [oph.form.validation :as validation]
            [oph.form.routes :refer :all]
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

(defn- hakemus-ok-response [hakemus submission]
  (ok {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
       :status (:status hakemus)
       :version (:version hakemus)
       :last_status_change_at (:last_status_change_at hakemus)
       :submission submission}))

(defn on-hakemus-create [haku-id answers]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        avustushaku-content (:content avustushaku)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        validation (validation/validate-form-security form answers)]
    (if (every? empty? (vals validation))
      (if-let [new-hakemus (va-db/create-hakemus! form-id answers)]
        ;; TODO: extract
        (do (let [language (keyword (find-hakemus-value answers "language"))
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
                                                  avustushaku-end-date))
            (hakemus-ok-response (:hakemus new-hakemus) (:submission new-hakemus)))
        (internal-server-error!))
      (bad-request! validation))))


(defn on-get-current-answers [haku-id hakemus-id]
  (let [form-id (:form (va-db/get-avustushaku haku-id))
                hakemus (va-db/get-hakemus hakemus-id)
                submission-id (:form_submission_id hakemus)
                submission (:body (get-form-submission form-id submission-id))
                submission-version (:version submission)]
            (if (= (:status hakemus) "new")
              (let [verified-hakemus (va-db/verify-hakemus hakemus-id submission-id submission-version)]
                (hakemus-ok-response verified-hakemus submission))
              (hakemus-ok-response hakemus submission))))

(defn on-hakemus-update [haku-id hakemus-id base-version answers]
  (let [form-id (:form (va-db/get-avustushaku haku-id))
               validation (validation/validate-form-security (form-db/get-form form-id) answers)]
           (if (every? empty? (vals validation))
             (let [hakemus (va-db/get-hakemus hakemus-id)]
               (if (= base-version (:version hakemus))
                 (let [updated-submission (:body (update-form-submission form-id (:form_submission_id hakemus) answers))
                       updated-hakemus (va-db/update-submission hakemus-id (:form_submission_id hakemus) (:version updated-submission))]
                   (hakemus-ok-response updated-hakemus updated-submission))
                 (hakemus-conflict-response hakemus)))
             (bad-request! validation))))

(defn on-hakemus-submit [haku-id hakemus-id base-version answers]
  (let [form-id (:form (va-db/get-avustushaku haku-id))
        validation (validation/validate-form (form-db/get-form form-id) answers)]
    (if (every? empty? (vals validation))
      (let [hakemus (va-db/get-hakemus hakemus-id)]
        (if (= base-version (:version hakemus))
          (let [submission-id (:form_submission_id hakemus)
                saved-submission (:body (update-form-submission form-id submission-id answers))
                submission-version (:version saved-submission)
                submitted-hakemus (va-db/submit-hakemus hakemus-id submission-id submission-version)
                ;; TODO: extract
                avustushaku (va-db/get-avustushaku haku-id)
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
            (hakemus-ok-response submitted-hakemus saved-submission))
          (hakemus-conflict-response hakemus)))
      (bad-request! validation))))
