(ns oph.va.virkailija.application-data
  (:require [oph.soresu.common.db :refer [exec query query-original-identifiers]]
            [oph.va.virkailija.db :as va-db]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [oph.va.hakija.api.queries :as hakija-queries]))

(defn get-application-evaluation [application-id]
  (convert-to-dash-keys
   (first (query-original-identifiers
           "SELECT a.budget_granted, a.costs_granted,
                   replace(a.talousarviotili, '.', '') AS takp_account,
                   status, should_pay
            FROM virkailija.arviot a WHERE a.hakemus_id = ?"
           [application-id]))))

(defn get-application-full-evaluation [application-id]
  (convert-to-dash-keys
   (first (query-original-identifiers
           "SELECT * FROM virkailija.arviot a WHERE a.hakemus_id = ?"
           [application-id]))))

(defn get-application-contact-person-name [hakemus-id]
  (:contact-person (first (query
                           "SELECT
       coalesce(
         normalized_hakemus.contact_person,
         answer->>'value'
       ) as contact_person
     FROM hakemukset
       LEFT JOIN normalized_hakemus ON (normalized_hakemus.hakemus_id = hakemukset.id)
       JOIN form_submissions ON (
         hakemukset.form_submission_id = form_submissions.id
         AND hakemukset.form_submission_version = form_submissions.version
       )
       JOIN jsonb_array_elements(answers->'value') answer ON (answer.value->>'key' = 'applicant-name')
     WHERE hakemukset.id = ? AND hakemukset.version_closed IS NULL"
                           [hakemus-id]))))

(defn get-application [id]
  (convert-to-dash-keys
   (merge
    (first (exec hakija-queries/get-application
                 {:application_id id}))
    (get-application-evaluation id))))

(defn find-application-by-register-number [register-number]
  (convert-to-dash-keys
   (first
    (exec hakija-queries/find-application-by-register-number
          {:register_number register-number}))))

(defn get-applications-with-evaluation-by-grant [grant-id]
  (mapv
   #(merge (convert-to-dash-keys %) (get-application-evaluation (:id %)))
   (exec hakija-queries/get-applications-by-grant
         {:grant_id grant-id})))

(defn get-application-unsent-payments [application-id]
  (map
   convert-to-dash-keys
   (query-original-identifiers
    "SELECT * FROM virkailija.payments
     WHERE application_id = ?
     AND paymentstatus_id IN ('created', 'waiting')
     AND version_closed IS NULL AND deleted IS NULL
     ORDER BY id DESC, version DESC"
    [application-id])))

(defn get-application-payments [id]
  (map convert-to-dash-keys
       (query-original-identifiers
        "SELECT payments.id, payments.version, payments.version_closed,
                payments.created_at, payments.application_id,
                payments.application_version, payments.paymentstatus_id,
                payments.filename, payments.user_name, payments.batch_id,
                payments.payment_sum, payments.phase, payments.project_code,
                coalesce(payments.pitkaviite, hakemukset.register_number) as pitkaviite
         FROM virkailija.payments
         JOIN hakija.hakemukset ON (
           hakemukset.id = payments.application_id
           AND hakemukset.version = payments.application_version)
         WHERE application_id = ?
         AND payments.version_closed IS NULL AND deleted IS NULL
         ORDER BY id"
        [id])))

(defn find-applications [search-term order]
  (map
   #(assoc (convert-to-dash-keys %)
           :evaluation (get-application-full-evaluation (:id %)))
   (exec (if (.endsWith order "-desc")
           hakija-queries/find-applications
           hakija-queries/find-applications-asc)
         {:search_term
          (str "%" (clojure.string/lower-case search-term) "%")})))

(defn create-application-token [application-id]
  (:token (va-db/create-application-token application-id)))

(defn get-application-token [application-id]
  (:token
   (first
    (exec hakija-queries/get-application-token
          {:application_id application-id}))))

(defn revoke-application-tokens [application-id]
  (exec hakija-queries/revoke-application-tokens
        {:application_id application-id}))

(defn has-no-payments? [application-id]
  (not
   (:has_payments
    (first
     (query-original-identifiers
      "SELECT COUNT(id) > 0 AS has_payments
       FROM virkailija.payments
       WHERE application_id = ? AND deleted IS NULL AND version_closed IS NULL
       LIMIT 1"
      [application-id])))))

(defn accepted? [application]
  (true?
   (get
    (first (query-original-identifiers
            "SELECT status = 'accepted' AS accepted
             FROM virkailija.arviot WHERE hakemus_id = ?"
            [(:id application)]))
    :accepted)))

(defn get-open-applications []
  (map
   convert-to-dash-keys
   (filter
    accepted?
    (exec hakija-queries/list-open-applications
          {}))))
