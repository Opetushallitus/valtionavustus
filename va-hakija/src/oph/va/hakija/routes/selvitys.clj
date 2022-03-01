(ns oph.va.hakija.routes.selvitys
  (:require [oph.soresu.common.db :refer [query]]
            [oph.soresu.form.validation :as validation]
            [oph.soresu.form.schema :as soresu-schema]
            [oph.soresu.form.db :as form-db]
            [oph.soresu.form.routes
             :refer [update-form-submission]]
            [oph.va.budget :as va-budget]
            [oph.va.hakija.db :as va-db]
            [oph.va.hakija.email :as va-email]
            [oph.va.hakija.handlers :as handlers]
            [oph.va.hakija.schema :as hakija-schema]
            [compojure.api.sweet :as compojure-api]
            [ring.util.http-response :as http]
            [schema.core :as s]))

(defn- selvitys-form-keyword [selvitys-type]
  (let [key (str "form_" selvitys-type)]
    (keyword key)))

(defn get-selvitys []
  (compojure-api/GET "/:haku-id/selvitys/:selvitys-type/:hakemus-id" [haku-id hakemus-id selvitys-type]
    :path-params [haku-id :- Long, hakemus-id :- s/Str selvitys-type :- s/Str]
    :return  hakija-schema/Hakemus
    :summary "Get current answers"
    (handlers/on-get-current-answers haku-id hakemus-id (selvitys-form-keyword selvitys-type))))

(defn- ok-id [hakemus]
  (http/ok {:id (:user_key hakemus)
            :language (:language hakemus)}))

(defn- create-selvitys-hakemus [selvitys-type avustushaku hakemus]
  (let [form-keyword                (keyword (str "form_" selvitys-type))
        form-id                     (form-keyword avustushaku)
        form                        (form-db/get-form form-id)
        register-number             (:register_number hakemus)
        answers                     {:value [{:key "language"
                                              :value (:language hakemus)
                                              :fieldType "radioButton"}]}
        budget-totals               (va-budget/calculate-totals-hakija answers avustushaku form)
        new-hakemus-with-submission (va-db/create-hakemus! (:id avustushaku)
                                                           form-id
                                                           answers
                                                           selvitys-type
                                                           register-number
                                                           budget-totals)
        new-hakemus                 (:hakemus new-hakemus-with-submission)
        new-hakemus-id              (:id new-hakemus)]
    (do (va-db/update-hakemus-parent-id new-hakemus-id (:id hakemus))
        new-hakemus)))

(defn get-selvitys-init []
  (compojure-api/GET "/:haku-id/selvitys/:selvitys-type/init/:hakemus-key" [haku-id selvitys-type hakemus-id]
    :path-params [haku-id :- Long, hakemus-key :- s/Str selvitys-type :- s/Str]
    :return hakija-schema/HakemusInfo
    :summary "Get or create selvitys for hakemus"
    (if-some [avustushaku (va-db/get-avustushaku haku-id)]
      (if-some [hakemus (va-db/get-hakemus hakemus-key)]
        (let [hakemus-id   (:id hakemus)]
          (if-some [existing-selvitys (va-db/find-hakemus-by-parent-id-and-type hakemus-id selvitys-type)]
            (ok-id existing-selvitys)
            (ok-id (create-selvitys-hakemus selvitys-type avustushaku hakemus))))
        (http/not-found))
      (http/not-found))))

(defn- on-selvitys-update [haku-id user-key base-version answers form-key]
  (let [hakemus (va-db/get-hakemus user-key)
        parent-hakemus (va-db/get-hakemus-by-id (:parent_id hakemus))
        avustushaku (va-db/get-avustushaku haku-id)
        form-id (form-key avustushaku)
        form (form-db/get-form form-id)
        security-validation (validation/validate-form-security form answers)
        is-updateable-selvitys (or
                                  (= (name form-key) "form_valiselvitys")
                                  (not (:loppuselvitys-information-verified-at parent-hakemus)))]
    (if (every? empty? (vals security-validation))
      (if (and is-updateable-selvitys (= base-version (:version hakemus)))
        (let [attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
              budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
              validation (merge (validation/validate-form form answers attachments)
                                (va-budget/validate-budget-hakija answers budget-totals form))
              updated-submission (:body (update-form-submission form-id (:form_submission_id hakemus) answers))
              updated-hakemus (va-db/update-submission haku-id
                                                       user-key
                                                       (:form_submission_id hakemus)
                                                       (:version updated-submission)
                                                       (:register_number hakemus)
                                                       answers
                                                       budget-totals)]
          (handlers/hakemus-ok-response updated-hakemus updated-submission validation parent-hakemus))
        (handlers/hakemus-conflict-response hakemus))
      (http/bad-request! security-validation))))

(defn post-selvitys []
  (compojure-api/POST "/:haku-id/selvitys/:selvitys-type/:hakemus-id/:base-version" [haku-id hakemus-id base-version selvitys-type :as request]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
    :body [answers (compojure-api/describe soresu-schema/Answers "New answers")]
    :return hakija-schema/Hakemus
    :summary "Update hakemus values"
    (on-selvitys-update haku-id hakemus-id base-version answers (selvitys-form-keyword selvitys-type))))

(defn- find-contact-person-email-from-last-hakemus-version [hakemus-id]
  (let [sql "SELECT answer.value->>'value' AS primary_email
             FROM hakija.hakemukset hakemus_version
             JOIN hakija.form_submissions fs ON hakemus_version.form_submission_id = fs.id AND hakemus_version.form_submission_version = fs.version
             JOIN jsonb_array_elements(fs.answers->'value') answer ON true
             WHERE hakemus_version.version_closed IS NULL
             AND hakemus_version.id = ?
             AND answer.value->>'key' = 'primary-email'"
        rows (query sql [hakemus-id])]
    (:primary-email (first rows))))

(defn- get-hakemus-contact-email [hakemus-id]
  (if-some [normalized-hakemus (va-db/get-normalized-hakemus-by-id hakemus-id)]
    (:contact-email normalized-hakemus)
    (find-contact-person-email-from-last-hakemus-version hakemus-id)))

(defn- on-selvitys-submit [haku-id selvitys-user-key base-version answers selvitys-field-keyword selvitys-type]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        form-id (selvitys-field-keyword avustushaku)
        form (form-db/get-form form-id)
        hakemus (va-db/get-hakemus selvitys-user-key)
        attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
        budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
        validation (merge (validation/validate-form form answers attachments)
                          (va-budget/validate-budget-hakija answers budget-totals form))]
    (if (every? empty? (vals validation))
      (if (= base-version (:version hakemus))
        (let [submission-id (:form_submission_id hakemus)
              saved-submission (:body (update-form-submission form-id submission-id answers))
              submitted-hakemus (va-db/submit-hakemus haku-id
                                                      selvitys-user-key
                                                      submission-id
                                                      (:version saved-submission)
                                                      (:register_number hakemus)
                                                      answers
                                                      budget-totals)
              lang (keyword (:language hakemus))
              parent_id (:parent_id hakemus)
              contact-email (get-hakemus-contact-email parent_id)
              parent-hakemus (va-db/get-hakemus-by-id parent_id)
              hakemus-name (:project-name parent-hakemus)
              register-number (:register-number parent-hakemus)]
          (if (= selvitys-type "loppuselvitys")
            (va-db/update-loppuselvitys-status parent_id "submitted")
            (va-db/update-valiselvitys-status parent_id "submitted"))
          (va-email/send-selvitys-submitted-message! haku-id selvitys-user-key selvitys-type lang parent_id hakemus-name register-number [contact-email])
          (handlers/hakemus-ok-response submitted-hakemus saved-submission validation nil))
        (handlers/hakemus-conflict-response hakemus))
      (http/bad-request! validation))))

(defn post-selvitys-submit []
  (compojure-api/POST "/:haku-id/selvitys/:selvitys-type/:hakemus-id/:base-version/submit" [haku-id selvitys-type hakemus-id base-version :as request]
    :path-params [haku-id :- Long, selvitys-type :- s/Str, hakemus-id :- s/Str, base-version :- Long]
    :body [answers (compojure-api/describe soresu-schema/Answers "New answers")]
    :return hakija-schema/Hakemus
    :summary "Submit hakemus"
    (on-selvitys-submit haku-id hakemus-id base-version answers (selvitys-form-keyword selvitys-type) selvitys-type)))
