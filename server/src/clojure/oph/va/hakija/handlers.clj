(ns oph.va.hakija.handlers
  (:require
   [clojure.tools.logging :as log]
   [oph.common.datetime :as datetime]
   [oph.soresu.common.config :refer [config]]
   [oph.soresu.common.db :refer [with-tx]]
   [oph.soresu.form.db :as form-db]
   [oph.soresu.form.formutil :refer :all]
   [oph.soresu.form.routes
    :refer [get-form-submission update-form-submission without-id]]
   [oph.soresu.form.schema :refer :all]
   [oph.soresu.form.validation :as validation]
   [oph.va.budget :as va-budget]
   [oph.va.hakija.attachment-validator :as attachment-validator]
   [oph.va.hakija.db :as va-db]
   [oph.va.hakija.email :as va-email]
   [oph.va.hakija.jotpa :refer [is-jotpa-avustushaku]]
   [oph.va.hakija.notification-formatter :as va-submit-notification]
   [oph.va.hakija.officer-edit-auth :as officer-edit-auth]
   [oph.va.routes :refer :all]
   [ring.util.http-response :refer :all]
   [oph.va.virkailija.authorization :as authorization]))

(defn hakemus-conflict-response [hakemus]
  (conflict! {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
              :status (:status hakemus)
              :version (:version hakemus)
              :version-closed (:version_closed hakemus)
              :version-date (:last_status_change_at hakemus)}))

(defn- get-open-avustushaku [haku-id hakemus]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        phase (avustushaku-phase avustushaku)]
    (if (or (= phase "current") (= (:status hakemus) "pending_change_request") (= (:status hakemus) "officer_edit") (= (:status hakemus) "applicant_edit"))
      avustushaku
      (method-not-allowed! {:phase phase}))))

(defn- get-open-avustushaku-tx [tx haku-id hakemus]
  (let [avustushaku (va-db/get-avustushaku-tx tx haku-id)
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
  (log/info "Creating hakemus for haku-id:" haku-id)
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
            (let [business-id (-> new-hakemus :hakemus :business_id)]
              (if (is-jotpa-avustushaku avustushaku)
                (va-email/send-new-jotpa-hakemus-message! language
                                                          [email]
                                                          haku-id
                                                          avustushaku-title
                                                          user-key
                                                          avustushaku-start-date
                                                          avustushaku-end-date
                                                          business-id)
                (va-email/send-new-hakemus-message! language
                                                    [email]
                                                    haku-id
                                                    avustushaku-title
                                                    user-key
                                                    avustushaku-start-date
                                                    avustushaku-end-date
                                                    business-id)))
            (hakemus-ok-response (:hakemus new-hakemus) (without-id (:submission new-hakemus)) validation nil))
          (internal-server-error!)))
      (bad-request! security-validation))))

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
        answers (:answers submission)
        budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)]
    (va-db/open-hakemus-applicant-edit haku-id hakemus submission-version answers budget-totals hakemus-id)))

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

(defn- try-store-normalized-hakemus [tx hakemus-id hakemus answers]
  (try
    (va-db/store-normalized-hakemus tx hakemus-id hakemus answers)
    (catch Exception e
      (log/warn "Could not normalize necessary hakemus fields for hakemus: " hakemus-id " Error: " (.getMessage e)))))

(defn- try-store-yhteishanke-organizations [tx hakemus-id answers]
  (try
    (va-db/store-yhteishanke-organizations tx hakemus-id answers)
    (catch Exception e
      (log/warn "Could not store yhteishanke organizations for hakemus: " hakemus-id " Error: " (.getMessage e)))))

(defn- store-normalized-hakemus-and-yhteishanke-organizations [tx hakemus-id hakemus answers]
  (try-store-normalized-hakemus tx hakemus-id hakemus answers)
  (try-store-yhteishanke-organizations tx hakemus-id answers))

(defn can-update-hakemus [haku-id user-key identity]
  (let [hakemus (va-db/get-hakemus user-key)
        {hakemus-id :id
         status :status} hakemus
        avustushaku (va-db/get-avustushaku haku-id)
        phase (avustushaku-phase avustushaku)
        officer-edit-authorized? (officer-edit-auth/hakemus-update-authorized? identity hakemus-id)]
    (or
     (= phase "current")
     (= status "pending_change_request")
     (= status "applicant_edit")
     (and (= status "officer_edit")
          officer-edit-authorized?))))

(defn on-hakemus-update [haku-id user-key base-version answers]
  (try (with-tx
         (fn [tx] (let [hakemus (va-db/get-locked-hakemus-version-for-update tx user-key base-version)
                        avustushaku (get-open-avustushaku-tx tx haku-id hakemus)
                        form-id (:form avustushaku)
                        form-submission-id (:form_submission_id hakemus)
                        form (form-db/get-form-tx tx form-id)
                        security-validation (validation/validate-form-security form answers)]
                    (if (every? empty? (vals security-validation))
                      (if (nil? (:version_closed hakemus))
                        (let [attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
                              budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
                              validation (merge (validation/validate-form form answers attachments)
                                                (va-budget/validate-budget-hakija answers budget-totals form))
                              updated-submission (:body (form-db/update-submission-tx! tx form-id form-submission-id answers))
                              updated-hakemus (va-db/update-hakemus-tx tx
                                                                       haku-id
                                                                       user-key
                                                                       (:version updated-submission)
                                                                       answers
                                                                       budget-totals
                                                                       hakemus)]
                          (store-normalized-hakemus-and-yhteishanke-organizations tx (:id hakemus) hakemus answers)
                          (hakemus-ok-response updated-hakemus updated-submission validation nil))
                        (hakemus-conflict-response hakemus))
                      (bad-request! security-validation)))))
       (catch java.sql.BatchUpdateException e
         (log/warn {:error (ex-message (ex-cause e)) :in "on-hakemus-update" :user-key user-key})
         (conflict!))))

(defn- get-valmistelijas-for-avustushaku [avustushaku-id]
  (filter authorization/is-valmistelija? (va-db/get-avustushaku-roles avustushaku-id)))

(defn on-refuse-application [hakemus-id base-version comment token]
  (let [hakemus (va-db/get-hakemus hakemus-id)
        avustushaku (va-db/get-avustushaku (:avustushaku hakemus))
        is-jotpa-hakemus (is-jotpa-avustushaku avustushaku)
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
        (let [virkailija-roles (get-valmistelijas-for-avustushaku (:id avustushaku))
              normalized-hakemus (va-db/get-normalized-hakemus hakemus-id)
              contact-email (:contact-email normalized-hakemus)
              trusted-contact-email (:trusted-contact-email normalized-hakemus)
              answer-email (find-answer-value (:answers submission) "primary-email")
              primary-contact-email (or contact-email answer-email)
              to (remove nil? (concat [primary-contact-email trusted-contact-email]))]
          (when (some #(when (some? (:email %)) true) virkailija-roles)
            (va-email/send-refused-message-to-presenter!
             (map :email (filter #(some? (:email %)) virkailija-roles))
             avustushaku
             (:id hakemus)))
          (when (< 0 (count to))
            (va-email/send-refused-message! lang to (get-in avustushaku [:content :name lang]) (:id hakemus) is-jotpa-hakemus (:business_id hakemus))))
        (hakemus-ok-response (va-db/get-hakemus hakemus-id) submission {} nil))
      :else (hakemus-conflict-response hakemus))))

(defn on-hakemus-submit [haku-id user-key base-version answers]
  (with-tx
    (fn [tx] (let [avustushaku (get-open-avustushaku-tx tx haku-id {})
                   form-id (:form avustushaku)
                   form (form-db/get-form-tx tx form-id)
                   hakemus (va-db/get-hakemus tx user-key)
                   attachments (va-db/get-attachments (:user_key hakemus) (:id hakemus))
                   budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
                   validation (merge (validation/validate-form form answers attachments)
                                     (va-budget/validate-budget-hakija answers budget-totals form))]
               (if (every? empty? (vals validation))
                 (if (= base-version (:version hakemus))
                   (let [submission-id (:form_submission_id hakemus)
                         saved-submission (:body (form-db/update-submission-tx! tx form-id submission-id answers))
                         submission-version (:version saved-submission)
                         submitted-hakemus (va-db/submit-hakemus tx
                                                                 haku-id
                                                                 hakemus
                                                                 submission-version
                                                                 answers
                                                                 budget-totals
                                                                 user-key)]
                     (store-normalized-hakemus-and-yhteishanke-organizations tx (:id hakemus) hakemus answers)
                     (va-submit-notification/send-submit-notifications! va-email/send-hakemus-submitted-message! false answers submitted-hakemus avustushaku (:id hakemus))
                     (hakemus-ok-response submitted-hakemus saved-submission validation nil))
                   (hakemus-conflict-response hakemus))
                 (bad-request! validation))))))

(defn on-hakemus-change-request-response [haku-id user-key base-version answers]
  (let [hakemus (va-db/get-hakemus user-key)
        avustushaku (get-open-avustushaku haku-id hakemus)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        attachments (va-db/get-attachments user-key (:id hakemus))
        budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
        validation (merge (validation/validate-form form answers attachments)
                          (va-budget/validate-budget-hakija answers budget-totals form))]
    (if (every? empty? (vals validation))
      (if (= base-version (:version hakemus))
        (let [submission-id (:form_submission_id hakemus)
              saved-submission (:body (update-form-submission form-id submission-id answers))
              submission-version (:version saved-submission)
              submitted-hakemus (with-tx #(va-db/submit-hakemus %
                                                                haku-id
                                                                hakemus
                                                                submission-version
                                                                answers
                                                                budget-totals
                                                                user-key))
              change-requests (va-db/list-hakemus-change-requests user-key)
              email-of-virkailija (:user_email (last change-requests))]
          (if email-of-virkailija
            (va-email/send-change-request-responded-message-to-virkailija! [email-of-virkailija] (:id avustushaku) (-> avustushaku :content :name :fi) (:id submitted-hakemus)))
          (va-submit-notification/send-submit-notifications! va-email/send-hakemus-submitted-message! true answers submitted-hakemus avustushaku (:id hakemus))
          (method-not-allowed! {:change-request-response "saved"}))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-hakemus-edit-submit [haku-id user-key base-version answers edit-type]
  (let [hakemus (va-db/get-hakemus user-key)
        avustushaku (va-db/get-avustushaku (:avustushaku hakemus))
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        attachments (va-db/get-attachments user-key (:id hakemus))
        budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
        validation (merge (validation/validate-form form answers attachments)
                          (va-budget/validate-budget-hakija answers budget-totals form))]
    (if (every? empty? (vals validation))
      (if (= base-version (:version hakemus))
        (let [submission-id (:form_submission_id hakemus)
              saved-submission (:body (update-form-submission form-id submission-id answers))
              submission-version (:version saved-submission)]
          (with-tx
            (fn [tx]
              (va-db/submit-hakemus
               tx
               haku-id
               hakemus
               submission-version
               answers
               budget-totals
               user-key)))
          (method-not-allowed! {edit-type "saved"}))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-applicant-edit-submit [haku-id user-key base-version answers edit-type]
  (let [hakemus (va-db/get-hakemus user-key)
        avustushaku (va-db/get-avustushaku (:avustushaku hakemus))
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        attachments (va-db/get-attachments user-key (:id hakemus))
        budget-totals (va-budget/calculate-totals-hakija answers avustushaku form)
        validation (merge (validation/validate-form form answers attachments)
                          (va-budget/validate-budget-hakija answers budget-totals form))]
    (if (every? empty? (vals validation))
      (if (= base-version (:version hakemus))
        (let [submission-id (:form_submission_id hakemus)
              saved-submission (:body (update-form-submission form-id submission-id answers))
              submission-version (:version saved-submission)]
          (with-tx
            (fn [tx]
              (va-db/submit-hakemus
               tx
               haku-id
               hakemus
               submission-version
               answers
               budget-totals
               user-key)))
          (ok {edit-type "saved"}))
        (hakemus-conflict-response hakemus))
      (bad-request! validation))))

(defn on-attachment-list [hakemus-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (va-db/get-attachments hakemus-id (:id hakemus))))

(defn on-attachment-create
  [hakemus-id hakemus-base-version field-id filename provided-content-type size tempfile]
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

(defn on-attachment-delete [hakemus-id field-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if (va-db/attachment-exists? (:id hakemus) field-id)
      (do (va-db/close-existing-attachment! (:id hakemus) field-id)
          (ok))
      (not-found))
    (not-found)))

(defn on-attachment-get [hakemus-id field-id]
  (if-let [hakemus (va-db/get-hakemus hakemus-id)]
    (if (va-db/attachment-exists-and-is-not-closed? (:id hakemus) field-id)
      (let [{:keys [data filename content-type]} (va-db/download-attachment (:id hakemus) field-id)]
        (-> (ok data)
            (assoc-in [:headers "Content-Type"] content-type)
            (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"" filename "\""))))
      (not-found))))
