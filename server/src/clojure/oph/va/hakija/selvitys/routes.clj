(ns oph.va.hakija.selvitys.routes
  (:require [clojure.tools.logging :as log]
            [compojure.api.sweet :as compojure-api]
            [oph.soresu.common.db :refer [query with-tx]]
            [oph.soresu.form.db :as form-db]
            [oph.soresu.form.routes
             :refer [update-form-submission]]
            [oph.soresu.form.schema :as soresu-schema]
            [oph.soresu.form.validation :as validation]
            [oph.va.budget :as va-budget]
            [oph.va.hakija.db :as va-db]
            [oph.va.hakija.email :as va-email]
            [oph.va.hakija.handlers :as handlers]
            [oph.va.hakija.jotpa :refer [is-jotpa-avustushaku]]
            [oph.va.hakija.schema :as hakija-schema]
            [ring.util.http-response :as http]
            [schema.core :as s]))

(s/defschema Selvitys
  "Hakemus with Selvitys-specific fields"
  (merge hakija-schema/Hakemus
         {:selvitys-updatable s/Bool
          :status-loppuselvitys (s/maybe s/Str)}))

(defn- selvitys-form-keyword [selvitys-type]
  (let [key (str "form_" selvitys-type)]
    (keyword key)))

(defn- selvitys-updateable? [selvitys-type parent-hakemus hakemus]
  (case selvitys-type
    "valiselvitys"  (not= (:status-valiselvitys parent-hakemus) "accepted")
    "loppuselvitys" (or (not (:loppuselvitys-information-verified-at parent-hakemus))
                        (and (= "loppuselvitys" (:hakemus_type hakemus)) (= "pending_change_request" (:status hakemus))))))

(defn selvitys-response [current-answers updatable]
  (let [{:keys [hakemus submission validation parent-hakemus]} current-answers]
    (merge (handlers/hakemus-response hakemus submission validation parent-hakemus)
           {:selvitys-updatable updatable
            :status-loppuselvitys (:status-loppuselvitys parent-hakemus)})))

(defn get-selvitys []
  (compojure-api/GET "/:haku-id/selvitys/:selvitys-type/:selvitys-key" []
    :path-params [haku-id :- Long, selvitys-key :- s/Str selvitys-type :- s/Str]
    :return Selvitys
    :summary "Get current answers"
    (let [current-answers (handlers/get-current-answers haku-id selvitys-key (selvitys-form-keyword selvitys-type))
          updatable       (selvitys-updateable? selvitys-type (:parent-hakemus current-answers) (:hakemus current-answers))]
      (http/ok (selvitys-response current-answers updatable)))))

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
                                                           budget-totals
                                                           (:id hakemus))]
    (:hakemus new-hakemus-with-submission)))

(defn get-selvitys-init []
  (compojure-api/GET "/:haku-id/selvitys/:selvitys-type/init/:hakemus-key" [haku-id selvitys-type hakemus-key]
    :path-params [haku-id :- Long, hakemus-key :- s/Str selvitys-type :- s/Str]
    :return hakija-schema/HakemusInfo
    :summary "Get or create selvitys for hakemus"
    (if-some [avustushaku (va-db/get-avustushaku haku-id)]
      (if-some [hakemus (va-db/get-hakemus hakemus-key)]
        (if-some [existing-selvitys (va-db/find-hakemus-by-parent-id-and-type (:id hakemus) selvitys-type)]
          (ok-id existing-selvitys)
          (ok-id (create-selvitys-hakemus selvitys-type avustushaku hakemus)))
        (http/not-found))
      (http/not-found))))

(defn- on-selvitys-update [haku-id user-key base-version answers selvitys-type]
  (try (with-tx
         (fn [tx] (let [hakemus (va-db/get-hakemus tx user-key)
                        parent-hakemus (va-db/get-hakemus-by-id-tx tx (:parent_id hakemus))
                        avustushaku (va-db/get-avustushaku-tx tx haku-id)
                        form-id (get avustushaku (selvitys-form-keyword selvitys-type))
                        form (form-db/get-form-tx tx form-id)
                        security-validation (validation/validate-form-security form answers)
                        updatable (selvitys-updateable? selvitys-type parent-hakemus hakemus)]
                    (if (not updatable)
                      (http/forbidden)
                      (if (not= base-version (:version hakemus))
                        (handlers/hakemus-conflict-response hakemus)
                        (if (not (every? empty? (vals security-validation)))
                          (http/bad-request! security-validation)
                          (let [attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
                                budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
                                validation (merge (validation/validate-form form answers attachments)
                                                  (va-budget/validate-budget-hakija answers budget-totals form))
                                updated-submission (:body (form-db/update-submission-tx! tx form-id (:form_submission_id hakemus) answers))
                                updated-hakemus (va-db/update-hakemus-tx tx
                                                                         haku-id
                                                                         user-key
                                                                         (:version updated-submission)
                                                                         answers
                                                                         budget-totals
                                                                         hakemus)]
                            (http/ok (selvitys-response {:hakemus updated-hakemus :submission updated-submission :validation validation :parent-hakemus parent-hakemus} updatable)))))))))
       (catch java.sql.BatchUpdateException e
         (log/warn {:error (ex-message (ex-cause e)) :in "on-selvitys-update" :user-key user-key})
         (http/conflict!))))

(defn post-selvitys []
  (compojure-api/POST "/:haku-id/selvitys/:selvitys-type/:hakemus-key/:base-version" [haku-id hakemus-key base-version selvitys-type :as request]
    :path-params [haku-id :- Long, hakemus-key :- s/Str, base-version :- Long]
    :body [answers (compojure-api/describe soresu-schema/Answers "New answers")]
    :return Selvitys
    :summary "Update hakemus values"
    (on-selvitys-update haku-id hakemus-key base-version answers selvitys-type)))

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

(defn- get-email-and-name-of-virkailija [hakemus-id]
  (let [sql "select h.user_email, h.user_first_name, h.user_last_name
             from hakija.hakemukset h
             where h.id = ? and
             h.status in ('pending_change_request', 'officer_edit') and
             h.last_status_change_at = h.created_at
             order by h.version"
        rows (query sql [hakemus-id])]
    (first rows)))

(defn- get-hakemus-contact-email [hakemus-id]
  (let [normalized-hakemus (va-db/get-normalized-hakemus-by-id hakemus-id)]
    (if (and normalized-hakemus (:contact-email normalized-hakemus))
      (:contact-email normalized-hakemus)
      (find-contact-person-email-from-last-hakemus-version hakemus-id))))

(defn- on-loppuselvitys-change-request-response [avustushaku-id selvitys-user-key base-version answers]
  (let [selvitys-type "loppuselvitys"
        selvitys-field-keyword (selvitys-form-keyword selvitys-type)
        avustushaku (va-db/get-avustushaku avustushaku-id)
        is-jotpa-avustushaku (is-jotpa-avustushaku avustushaku)
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
              submitted-hakemus (with-tx #(va-db/submit-hakemus
                                           %
                                           avustushaku-id
                                           hakemus
                                           (:version saved-submission)
                                           answers
                                           budget-totals
                                           selvitys-user-key))
              lang (keyword (:language hakemus))
              parent-hakemus-id (:parent_id hakemus)
              id (:id hakemus)
              virkailija-name-and-email (get-email-and-name-of-virkailija id)
              email-of-virkailija (:user-email virkailija-name-and-email)
              virkailija-first-name (-> virkailija-name-and-email :user-first-name)
              virkailija-last-name (-> virkailija-name-and-email :user-last-name)
              email-of-hakija (get-hakemus-contact-email parent-hakemus-id)
              avustushaku-name-fi (-> avustushaku :content :name :fi)
              register-number (-> hakemus :register_number)
              parent-hakemus (va-db/get-hakemus-by-id parent-hakemus-id)
              project-name (-> parent-hakemus :project-name)]

          (va-db/update-loppuselvitys-status id "submitted")
          (va-email/send-loppuselvitys-change-request-responded-message-to-virkailija! [email-of-virkailija]
                                                                                       avustushaku-id
                                                                                       avustushaku-name-fi
                                                                                       parent-hakemus-id)
          (va-email/send-loppuselvitys-change-request-received-message-to-hakija! [email-of-hakija]
                                                                                  parent-hakemus-id
                                                                                  lang
                                                                                  register-number
                                                                                  project-name
                                                                                  email-of-virkailija
                                                                                  virkailija-first-name
                                                                                  virkailija-last-name
                                                                                  is-jotpa-avustushaku)
          (handlers/hakemus-ok-response submitted-hakemus saved-submission validation nil))
        (handlers/hakemus-conflict-response hakemus))
      (http/bad-request! validation))))

(defn post-loppuselvitys-change-request-response []
  (compojure-api/POST "/:avustushaku-id/selvitys/loppuselvitys/:selvitys-key/:version/change-request-response" [avustushaku-id selvitys-key version :as request]
    :path-params [avustushaku-id :- Long, selvitys-key :- s/Str version :- Long]
    :body    [answers (compojure-api/describe soresu-schema/Answers "New answers")]
    :return  nil
    :summary "Submit response for loppuselvitys change request"
    (if (handlers/can-update-hakemus avustushaku-id selvitys-key nil)
      (on-loppuselvitys-change-request-response avustushaku-id selvitys-key version answers)
      (http/bad-request! {:error "can not update loppuselvitys"}))))

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
              submitted-hakemus (with-tx #(va-db/submit-hakemus
                                           %
                                           haku-id
                                           hakemus
                                           (:version saved-submission)
                                           answers
                                           budget-totals
                                           selvitys-user-key))
              lang (keyword (:language hakemus))
              parent_id (:parent_id hakemus)
              contact-email (get-hakemus-contact-email parent_id)
              parent-hakemus (va-db/get-hakemus-by-id parent_id)
              hakemus-name (:project-name parent-hakemus)
              register-number (:register-number parent-hakemus)
              is-jotpa (is-jotpa-avustushaku avustushaku)]
          (if (= selvitys-type "loppuselvitys")
            (va-db/update-loppuselvitys-status parent_id "submitted")
            (va-db/update-valiselvitys-status parent_id "submitted"))
          (va-email/send-selvitys-submitted-message! haku-id selvitys-user-key selvitys-type lang parent_id hakemus-name register-number [contact-email] is-jotpa)
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
