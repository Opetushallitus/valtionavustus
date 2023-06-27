(ns oph.va.hakija.handlers
  (:require [clojure.tools.logging :as log]
            [ring.util.http-response :refer :all]
            [oph.soresu.common.config :refer [config feature-enabled?]]
            [oph.soresu.common.db :refer [with-tx]]
            [oph.common.datetime :as datetime]
            [oph.soresu.form.db :as form-db]
            [oph.soresu.form.validation :as validation]
            [oph.soresu.form.routes
             :refer [get-form-submission without-id update-form-submission]]
            [oph.soresu.form.formutil :refer :all]
            [oph.va.routes :refer :all]
            [oph.soresu.form.schema :refer :all]
            [oph.va.budget :as va-budget]
            [oph.va.hakija.db :as va-db]
            [oph.va.hakija.notification-formatter :as va-submit-notification]
            [oph.va.hakija.attachment-validator :as attachment-validator]
            [oph.va.hakija.email :as va-email]
            [oph.va.hakija.officer-edit-auth :as officer-edit-auth]))

(defn hakemus-conflict-response [hakemus]
  (conflict! {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
              :status (:status hakemus)
              :version (:version hakemus)
              :version-date (:last_status_change_at hakemus)}))

(defn- get-open-avustushaku [haku-id hakemus]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        phase (avustushaku-phase avustushaku)]
    (if (or (= phase "current") (= (:status hakemus) "pending_change_request") (= (:status hakemus) "officer_edit") (= (:status hakemus) "applicant_edit"))
      avustushaku
      (method-not-allowed! {:phase phase}))))

(defn hakemus-response [hakemus submission validation parent-hakemus]
  {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
   :created-at (:created_at hakemus)
   :status (:status hakemus)
   :status-comment (:status_change_comment hakemus)
   :register-number (:register_number hakemus)
   :version (:version hakemus)
   :version-date (:last_status_change_at hakemus)
   :submission (without-id submission)
   :validation-errors validation
   :refused (:refused hakemus)
   :refused-at (:refused_at hakemus)
   :refused-comment (:refused_comment hakemus)
   :loppuselvitys-information-verified-at (:loppuselvitys-information-verified-at parent-hakemus)})

(defn hakemus-ok-response [hakemus submission validation parent-hakemus]
  (ok (hakemus-response hakemus submission validation parent-hakemus)))

(defn on-hakemus-create [haku-id answers]
  (let [avustushaku (get-open-avustushaku haku-id {})
        avustushaku-content (:content avustushaku)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        security-validation (validation/validate-form-security form answers)]
    (if (every? empty? (vals security-validation))
      (let [budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)]
        (if-let [new-hakemus (va-db/create-hakemus! haku-id
                                                    form-id
                                                    answers
                                                    "hakemus"
                                                    nil
                                                    budget-totals
                                                    nil)]
          (let [validation (merge (validation/validate-form form answers {})
                                  (va-budget/validate-budget-hakija answers budget-totals form))
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
            (hakemus-ok-response (:hakemus new-hakemus) (without-id (:submission new-hakemus)) validation nil))
          (internal-server-error!)))
      (bad-request! security-validation))))

(defn- sum-normalized-hakemus-budget [hakemus]
  (when-let [talousarvio (:talousarvio hakemus)]
    (reduce (fn [sum menoluokka] (+ sum (:amount menoluokka))) 0 talousarvio)))

(defn- sum-muutoshakemus-budget [muutoshakemus]
  (when-let [talousarvio (:talousarvio muutoshakemus)]
    (reduce (fn [sum [type amount]] (+ sum amount)) 0 talousarvio)))

(defn validate-muutoshakemus [user-key muutoshakemus]
  (let [muutoshakemus-budget (sum-muutoshakemus-budget muutoshakemus)
        hakemus (when muutoshakemus-budget (va-db/get-normalized-hakemus user-key))
        hakemus-budget (when hakemus (sum-normalized-hakemus-budget hakemus))]
    (when (and muutoshakemus-budget (not= hakemus-budget muutoshakemus-budget))
      [(str "muutoshakemus budget was " muutoshakemus-budget " (should be " hakemus-budget ")")])))

(defn- should-notify-valimistelija-of-new-muutoshakemus [muutoshakemus]
  (or (:talousarvio muutoshakemus)
      (get-in muutoshakemus [:jatkoaika :haenKayttoajanPidennysta])
      (get-in muutoshakemus [:sisaltomuutos :haenSisaltomuutosta])))

(defn on-post-muutoshakemus [user-key muutoshakemus]
  (let [hakemus (va-db/get-hakemus user-key)
        avustushaku-id (:avustushaku hakemus)
        hakemus-id (:id hakemus)
        register-number (:register_number hakemus)
        normalized-hakemus (va-db/get-normalized-hakemus user-key)
        hanke (:project-name normalized-hakemus)
        valmistelija-email (:email (va-db/get-valmistelija-assigned-to-hakemus hakemus-id))]
    (va-db/on-muutoshakemus user-key hakemus-id avustushaku-id muutoshakemus)
    (if (should-notify-valimistelija-of-new-muutoshakemus muutoshakemus)
      (if (nil? valmistelija-email)
        (log/info "Hakemus" hakemus-id "is missing valmistelija. Can't send notification of new muutoshakemus.")
        (va-email/notify-valmistelija-of-new-muutoshakemus [valmistelija-email] avustushaku-id register-number hanke hakemus-id)))
    (ok (va-db/get-normalized-hakemus user-key))))

(defn on-get-decision-answers [haku-id hakemus-id form-key]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        form-id (form-key avustushaku)
        form (form-db/get-form form-id)
        current-hakemus (va-db/get-hakemus hakemus-id)
        paatos (va-db/get-hakemus-paatos (:id current-hakemus))]
    (if (nil? paatos)
      (no-content)
      (let [hakemus (va-db/get-hakemus-version hakemus-id (:hakemus_version paatos))
            submission-id (:form_submission_id hakemus)
            submission (form-db/get-form-submission-version
                        form-id submission-id
                        (:form_submission_version hakemus))
            submission-version (:version submission)
            answers (:answers submission)
            attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
            budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
            validation (merge (validation/validate-form form answers attachments)
                              (va-budget/validate-budget-hakija answers budget-totals form))]
        (hakemus-ok-response hakemus submission validation nil)))))

(defn on-hakemus-applicant-edit-open [haku-id hakemus-id]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        avustushaku (va-db/get-avustushaku haku-id)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        submission-id (:form_submission_id hakemus)
        submission (form-db/get-form-submission-version
                    form-id submission-id
                    (:form_submission_version hakemus))
        submission-version (:version submission)
        register-number (:register_number hakemus)
        answers (:answers submission)
        budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)]
    (va-db/open-hakemus-applicant-edit haku-id hakemus-id submission-id submission-version register-number answers budget-totals)))

(defn get-current-answers [haku-id hakemus-key form-key]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        form-id (form-key avustushaku)
        form (form-db/get-form form-id)
        hakemus (va-db/get-hakemus hakemus-key)
        submission-id (:form_submission_id hakemus)
        submission (:body (get-form-submission form-id submission-id))
        answers (:answers submission)
        attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
        budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)]
    {:hakemus        (if (= (:status hakemus) "new")
                       (va-db/verify-hakemus haku-id
                                             hakemus-key
                                             submission-id
                                             (:version submission)
                                             (:register_number hakemus)
                                             answers
                                             budget-totals)
                       hakemus)
     :submission     submission
     :validation     (merge (validation/validate-form form answers attachments)
                            (va-budget/validate-budget-hakija answers budget-totals form))
     :parent-hakemus (va-db/get-hakemus-by-id (:parent_id hakemus))}))

(defn on-get-current-answers [haku-id hakemus-id form-key]
  (let [{:keys [hakemus submission validation parent-hakemus]} (get-current-answers haku-id hakemus-id form-key)]
    (hakemus-ok-response hakemus submission validation parent-hakemus)))

(defn try-store-normalized-hakemus [hakemus-id hakemus answers haku-id]
  (try
    (va-db/store-normalized-hakemus hakemus-id hakemus answers)
    true
    (catch Exception e
      (log/info "Could not normalize necessary hakemus fields for hakemus: " hakemus-id " Error: " (.getMessage e))
      false)))

(defn can-update-hakemus [haku-id user-key answers identity]
  (let [hakemus (va-db/get-hakemus user-key)
        hakemus-id (:id hakemus)
        avustushaku (va-db/get-avustushaku haku-id)
        phase (avustushaku-phase avustushaku)
        status (:status hakemus)
        officer-edit-authorized? (officer-edit-auth/hakemus-update-authorized? identity hakemus-id)]
    (or
      (= phase "current")
      (= status "pending_change_request")
      (= status "applicant_edit")
      (and (= status "officer_edit")
           officer-edit-authorized?))))

(defn on-hakemus-update [haku-id hakemus-id base-version answers]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        avustushaku (get-open-avustushaku haku-id hakemus)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        security-validation (validation/validate-form-security form answers)]
    (if (every? empty? (vals security-validation))
      (if (= base-version (:version hakemus))
        (let [attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
              budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
              validation (merge (validation/validate-form form answers attachments)
                                (va-budget/validate-budget-hakija answers budget-totals form))
              updated-submission (:body (update-form-submission form-id (:form_submission_id hakemus) answers))
              updated-hakemus (va-db/update-submission haku-id
                                                       hakemus-id
                                                       (:form_submission_id hakemus)
                                                       (:version updated-submission)
                                                       (:register_number hakemus)
                                                       answers
                                                       budget-totals)
              normalized-hakemus-success (try-store-normalized-hakemus (:id hakemus) hakemus answers haku-id)]
          (hakemus-ok-response updated-hakemus updated-submission validation nil))
        (hakemus-conflict-response hakemus))
      (bad-request! security-validation))))

(defn- is-valmistelija? [role]
  (or
    (= (:role role) "presenting_officer")
    (= (:role role) "vastuuvalmistelija")))

(defn- get-valmistelijas-for-avustushaku [avustushaku-id]
  (filter is-valmistelija? (va-db/get-avustushaku-roles avustushaku-id)))

(defn on-refuse-application [avustushaku-id hakemus-id base-version comment token]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        avustushaku (va-db/get-avustushaku (:avustushaku hakemus))
        submission (:body (get-form-submission
                           (:form avustushaku)
                           (:form_submission_id hakemus)))
        lang (keyword (get-in hakemus [:hakemus :language] "fi"))]
    (cond
      (not (va-db/valid-token? token (:id hakemus)))
      (unauthorized "Incorrect token")
      (and (= (:version hakemus) base-version)
           (not (:refused hakemus)))
      (do
        (with-tx (fn [tx] (va-db/refuse-application tx (:id hakemus) comment)))
        (let [virkailija-roles (get-valmistelijas-for-avustushaku (:id avustushaku))]
          (when (some #(when (some? (:email %)) true) virkailija-roles)
            (va-email/send-refused-message-to-presenter!
             (map :email (filter #(some? (:email %)) virkailija-roles))
             avustushaku
             (:id hakemus))))
        (when-let [email (find-answer-value
                          (:answers submission) "primary-email")]
          (va-email/send-refused-message!
           lang [email] (get-in avustushaku [:content :name lang])))
        (hakemus-ok-response (va-db/get-hakemus hakemus-id) submission {} nil))
      :else (hakemus-conflict-response hakemus))))

(defn on-hakemus-submit [haku-id hakemus-id base-version answers]
  (let [avustushaku (get-open-avustushaku haku-id {})
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        hakemus (va-db/get-hakemus hakemus-id)
        attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
        budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
        validation (merge (validation/validate-form form answers attachments)
                          (va-budget/validate-budget-hakija answers budget-totals form))]
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
                                                      answers
                                                      budget-totals)
              normalized-hakemus-success (try-store-normalized-hakemus (:id hakemus) hakemus answers haku-id)]
          (va-submit-notification/send-submit-notifications! va-email/send-hakemus-submitted-message! false answers submitted-hakemus avustushaku (:id hakemus))
          (hakemus-ok-response submitted-hakemus saved-submission validation nil))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-hakemus-change-request-response [haku-id hakemus-id base-version answers]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        avustushaku (get-open-avustushaku haku-id hakemus)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        attachments (va-db/get-attachments hakemus-id (:id hakemus))
        budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
        validation (merge (validation/validate-form form answers attachments)
                          (va-budget/validate-budget-hakija answers budget-totals form))]
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
                                                      answers
                                                      budget-totals)
              change-requests (va-db/list-hakemus-change-requests hakemus-id)
              email-of-virkailija (:user_email (last change-requests))]
          (if email-of-virkailija
            (va-email/send-change-request-responded-message-to-virkailija! [email-of-virkailija] (:id avustushaku) (-> avustushaku :content :name :fi) (:id submitted-hakemus)))
          (va-submit-notification/send-submit-notifications! va-email/send-hakemus-submitted-message! true answers submitted-hakemus avustushaku)
          (method-not-allowed! {:change-request-response "saved"}))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-hakemus-edit-submit [haku-id hakemus-id base-version answers edit-type]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        avustushaku (va-db/get-avustushaku (:avustushaku hakemus))
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        attachments (va-db/get-attachments hakemus-id (:id hakemus))
        budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
        validation (merge (validation/validate-form form answers attachments)
                          (va-budget/validate-budget-hakija answers budget-totals form))
        lang (keyword (get-in hakemus [:hakemus :language] "fi"))]
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
                                                      answers
                                                      budget-totals)
              submission (:body (get-form-submission
                                 (:form avustushaku)
                                 (:form_submission_id hakemus)))]

          (when (= edit-type :applicant-edit)
            (when-let [email (find-answer-value
                              (:answers submission) "primary-email")]
              (va-email/send-applicant-edit-message!
               lang [email] (get-in avustushaku [:content :name lang]) hakemus)))

          (method-not-allowed! {edit-type "saved"}))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-attachment-list [haku-id hakemus-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (va-db/get-attachments hakemus-id (:id hakemus))))

(defn on-attachment-create
  [haku-id hakemus-id hakemus-base-version field-id filename provided-content-type size tempfile]
  {:post [(some? %)]}
  (let [content-type-validation-result (attachment-validator/validate-file-content-type tempfile provided-content-type)
        detected-content-type          (:detected-content-type content-type-validation-result)]
    (if (:allowed? content-type-validation-result)
      (if-let [hakemus (va-db/get-hakemus hakemus-id)]
        (let [fixed-filename (attachment-validator/file-name-according-to-content-type filename detected-content-type)]
          (when (not= fixed-filename filename)
            (log/warn (str "Request with filename '"
                           filename
                           "' has wrong extension for it's content-type '"
                           detected-content-type
                           "'. Renaming to '"
                           fixed-filename
                           "'.")))
          (when-let [attachment (va-db/create-attachment (:id hakemus)
                                                         hakemus-base-version
                                                         field-id
                                                         fixed-filename
                                                         detected-content-type
                                                         size
                                                         tempfile)]
            (-> (ok (va-db/convert-attachment (:id hakemus) attachment)))))
        (not-found))
      (do
        (log/warn (str "Request with illegal content-type '"
                       detected-content-type
                       "' of file '"
                       filename
                       "' (provided '"
                       provided-content-type
                       "')"))
        (bad-request (merge content-type-validation-result {:error true}))))))

(defn on-attachment-delete [haku-id hakemus-id field-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if (va-db/attachment-exists? (:id hakemus) field-id)
      (do (va-db/close-existing-attachment! (:id hakemus) field-id)
          (ok))
      (not-found))
    (not-found)))

(defn on-attachment-get [haku-id hakemus-id field-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if (va-db/attachment-exists-and-is-not-closed? (:id hakemus) field-id)
      (let [{:keys [data size filename content-type]} (va-db/download-attachment (:id hakemus) field-id)]
        (-> (ok data)
            (assoc-in [:headers "Content-Type"] content-type)
            (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"" filename "\""))))
      (not-found))))
