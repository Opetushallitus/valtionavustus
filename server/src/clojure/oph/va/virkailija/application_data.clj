(ns oph.va.virkailija.application-data
  (:require [oph.soresu.common.db :refer [execute! query query-original-identifiers]]
            [oph.va.virkailija.db :as va-db]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]))

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
    (first (query-original-identifiers
            "SELECT
                h.id, h.created_at, h.version, h.budget_total, h.budget_oph_share,
                h.organization_name, h.project_name, h.register_number, h.language,
                h.avustushaku AS grant_id, s.answers->'value' AS answers, refused,
                refused_comment, refused_at, codes.code as project_code
              FROM hakija.hakemukset h
              JOIN hakija.form_submissions s
                ON (h.form_submission_id = s.id AND h.form_submission_version = s.version)
              LEFT JOIN virkailija.va_code_values codes ON (codes.id = h.project_id)
              WHERE h.id = ?
                AND h.status != 'cancelled' AND h.status != 'new' AND h.status != 'draft'
                AND h.version_closed IS NULL AND h.hakemus_type = 'hakemus'
              ORDER BY upper(h.organization_name), upper(h.project_name)"
            [id]))
    (get-application-evaluation id))))

(defn find-application-by-register-number [register-number]
  (convert-to-dash-keys
   (first
    (query-original-identifiers
     "SELECT id, created_at, version, budget_total, budget_oph_share,
              organization_name, project_name, register_number, parent_id, language,
              avustushaku AS grant_id, refused, refused_comment, refused_at
       FROM hakija.hakemukset
       WHERE register_number = ?
         AND status != 'cancelled' AND status != 'new' AND status != 'draft'
         AND hakemus_type = 'hakemus' AND version_closed IS NULL
       ORDER BY id DESC LIMIT 1"
     [register-number]))))

(defn get-applications-with-evaluation-by-grant [grant-id]
  (mapv
   #(merge (convert-to-dash-keys %) (get-application-evaluation (:id %)))
   (query-original-identifiers
    "SELECT
        h.id, h.created_at, h.version, h.budget_total, h.budget_oph_share,
        h.organization_name, h.project_name, h.register_number, h.language,
        h.avustushaku AS grant_id, s.answers->'value' AS answers, h.refused,
        h.refused_comment, h.refused_at, va_codes.code as project_code
      FROM hakija.hakemukset h
      JOIN hakija.form_submissions s
        ON (h.form_submission_id = s.id AND h.form_submission_version = s.version)
      LEFT JOIN virkailija.va_code_values va_codes ON (h.project_id = va_codes.id)
      WHERE h.avustushaku = ?
        AND h.status != 'cancelled' AND h.status != 'new' AND h.status != 'draft'
        AND h.version_closed IS NULL AND h.hakemus_type = 'hakemus'
      ORDER BY upper(h.organization_name), upper(h.project_name)"
    [grant-id])))

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
  (let [order-dir (if (.endsWith order "-desc") "DESC" "ASC")
        sql (str "SELECT
                    h.id, h.created_at, h.version, h.budget_total, h.budget_oph_share,
                    h.organization_name, h.project_name, h.register_number, h.parent_id,
                    h.language, h.avustushaku AS grant_id, h.refused, h.refused_comment,
                    h.refused_at, a.content#>'{name, fi}' AS grant_name
                  FROM hakija.hakemukset h
                  LEFT JOIN hakija.avustushaut a ON a.id = h.avustushaku
                  WHERE h.version_closed IS NULL
                    AND (h.register_number LIKE ?
                         OR LOWER(h.project_name) LIKE ?
                         OR LOWER(h.organization_name) LIKE ?)
                  ORDER BY created_at " order-dir)]
    (map
     #(assoc (convert-to-dash-keys %)
             :evaluation (get-application-full-evaluation (:id %)))
     (query-original-identifiers
      sql
      (let [term (str "%" (clojure.string/lower-case search-term) "%")]
        [term term term])))))

(defn create-application-token [application-id]
  (:token (va-db/create-application-token application-id)))

(defn get-application-token [application-id]
  (:token
   (first
    (query-original-identifiers
     "SELECT token FROM hakija.application_tokens
       WHERE application_id = ? AND revoked IS NULL LIMIT 1"
     [application-id]))))

(defn revoke-application-tokens [application-id]
  (execute!
   "UPDATE hakija.application_tokens SET revoked = TRUE
     WHERE application_id = ? AND revoked IS NOT TRUE"
   [application-id]))

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
    (query-original-identifiers
     "SELECT
         h.id, h.avustushaku AS grant_id, h.budget_total, h.budget_oph_share,
         h.organization_name, h.project_name, h.register_number,
         a.content#>'{name}' AS grant_name,
         a.content#>'{duration, start}' AS grant_start,
         a.content#>'{duration, end}' AS grant_end,
         a.decision#>'{date}' AS grant_decision_date
       FROM hakija.hakemukset h
       LEFT JOIN hakija.avustushaut a ON a.id = h.avustushaku
       WHERE h.hakemus_type = 'hakemus'
         AND h.version_closed IS NULL
         AND h.status_loppuselvitys = 'missing'
         AND h.status != 'new'
         AND h.status != 'cancelled'
         AND h.status != 'draft'
       ORDER BY h.id"
     []))))
