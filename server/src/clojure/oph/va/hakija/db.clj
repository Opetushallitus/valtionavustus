(ns oph.va.hakija.db
  (:use [oph.soresu.common.db]
        [oph.soresu.form.db :as form-db]
        [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [clojure.string]
            [clojure.tools.logging :as log]
            [ring.util.codec :refer [form-encode]]
            [oph.soresu.common.db :refer [with-tx query query-original-identifiers execute! named-query named-execute!]]
            [oph.soresu.common.jdbc.extensions :refer :all]
            [oph.soresu.form.formutil :as form-util]
            [oph.va.hakemus.db :as hakemus-copy]
            [oph.va.jdbc.extensions :refer :all]
            [oph.soresu.common.config :refer [config feature-enabled?]]))

(defn slurp-binary-file! [file]
  (io! (with-open [reader (io/input-stream file)]
         (let [buffer (byte-array (.length file))]
           (.read reader buffer)
           buffer))))

(defn health-check []
  (->> {}
       (query "select 1")
       first
       :?column?
       (= 1)))

(defn get-avustushaku [id]
  (first
   (query-original-identifiers
    "select avustushaut.*, va_code_values.code as operational_unit_code
       from hakija.avustushaut
       left join virkailija.va_code_values on avustushaut.operational_unit_id = va_code_values.id
       where avustushaut.id = ? and status <> 'deleted'"
    [id])))

(defn get-avustushaku-tx [tx id]
  (first (query-original-identifiers tx
                                     "select avustushaut.*, va_code_values.code as operational_unit_code
            from hakija.avustushaut
            left join virkailija.va_code_values on avustushaut.operational_unit_id = va_code_values.id
            where avustushaut.id = ?"
                                     [id])))

(defn get-avustushaku-roles [avustushaku-id]
  (query-original-identifiers
   "SELECT name, email, role FROM avustushaku_roles
     WHERE avustushaku = ? ORDER BY id DESC"
   [avustushaku-id]))

(defn list-avustushaut []
  (query-original-identifiers "select * from avustushaut" []))

(defn add-paatos-view [hakemus-id headers remote-addr]
  (execute!
   "insert into hakemus_paatokset_views (hakemus_id,headers,remote_addr) values (?,?,?)"
   [hakemus-id headers remote-addr]))

(defn- pluck-key [answers key as default]
  (let [value (or (form-util/find-answer-value answers key) default)]
    {as value}))

(defn- get-organization-name [answers] (pluck-key answers "organization" :organization_name ""))
(defn- get-project-name [answers] (pluck-key answers "project-name" :project_name ""))
(defn- get-language [answers] (pluck-key answers "language" :language "fi"))
(defn- get-owner-type [answers] (pluck-key answers "radioButton-0" :owner_type ""))
(defn- get-business-id [answers] (pluck-key answers "business-id" :business_id ""))

(defn- merge-calculated-params [params answers]
  (merge params
         (get-organization-name answers)
         (get-project-name answers)
         (get-language answers)
         (get-owner-type answers)
         (get-business-id answers)))

(defn get-hakemus
  ([user-key]
   (first
    (query-original-identifiers
     "select * from hakemukset where user_key = ? AND version_closed IS NULL and status <> 'cancelled'"
     [user-key])))
  ([tx user-key]
   (first
    (query-original-identifiers tx
                                "select * from hakemukset where user_key = ? AND version_closed IS NULL and status <> 'cancelled'"
                                [user-key]))))

(defn get-locked-hakemus-version-for-update [tx id version]
  (first (query-original-identifiers tx "SELECT * FROM hakemukset WHERE user_key = ? AND version = ?" [id version])))

(defn get-hakemus-by-id-tx [tx id]
  (first (query tx "SELECT * FROM hakemukset WHERE id = ? AND version_closed IS NULL" [id])))

(defn get-hakemus-by-id [id]
  (with-tx (fn [tx] (get-hakemus-by-id-tx tx id))))

(defn get-hakemus-version [user-key version]
  (first
   (query-original-identifiers
    "SELECT * FROM hakemukset WHERE user_key = ? AND version = ? AND status <> 'cancelled' LIMIT 1"
    [user-key version])))

(defn get-hakemus-paatos [hakemus-id]
  (first
   (query-original-identifiers
    "select * from hakemus_paatokset where hakemus_id = ?"
    [hakemus-id])))

(defn list-hakemus-change-requests [user-key]
  (query-original-identifiers
   "select * from hakemukset
     where user_key = ? and status in ('pending_change_request', 'officer_edit') and last_status_change_at = created_at
     order by version"
   [user-key]))

(defn find-hakemus-by-parent-id-and-type [parent-id hakemus-type]
  (first
   (query-original-identifiers
    "select * from hakemukset where parent_id = ? and hakemus_type = ? AND version_closed IS NULL"
    [parent-id hakemus-type])))

(defn- register-number-sequence-exists? [register-number]
  (some? (first (query-original-identifiers
                 "select 1 from register_number_sequences where suffix = ?"
                 [register-number]))))

(defn- generate-register-number [avustushaku-id]
  (if-let [avustushaku-register-number (-> (get-avustushaku avustushaku-id) :register_number)]
    (when (re-matches #"\d+/\d+" avustushaku-register-number)
      (let [{:keys [seq_number]}
            (if (register-number-sequence-exists? avustushaku-register-number)
              (first (query-original-identifiers
                      "update register_number_sequences set seq_number = seq_number+1
                        where suffix = ? RETURNING *"
                      [avustushaku-register-number]))
              (first (query-original-identifiers
                      "insert into register_number_sequences (suffix) values (?) RETURNING *"
                      [avustushaku-register-number])))]
        (format "%d/%s" seq_number avustushaku-register-number)))))

(defn- convert-budget-totals [budget-totals]
  {:budget_total (or (:total-needed budget-totals) 0)
   :budget_oph_share (or (:oph-share budget-totals) 0)})

(defn create-hakemus! [avustushaku-id form-id answers hakemus-type register-number budget-totals parent-id]
  (let [submission (form-db/create-submission! form-id answers)
        user-key (generate-hash-id)
        params (-> {:avustushaku_id  avustushaku-id
                    :user_key        user-key
                    :form_submission (:id submission)
                    :register_number (if (nil? register-number) (generate-register-number avustushaku-id) register-number)
                    :hakemus_type    hakemus-type
                    :parent_id       parent-id}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params answers))
        hakemus (first
                 (named-query
                  "INSERT INTO hakemukset (id, avustushaku, version, user_key, form_submission_id,
                       form_submission_version, budget_total, budget_oph_share, organization_name,
                       project_name, language, register_number, last_status_change_at, hakemus_type, parent_id)
                     SELECT nextval('hakemukset_id_seq'), :avustushaku_id, 0, :user_key, submissions.id,
                       submissions.version, :budget_total, :budget_oph_share, :organization_name,
                       :project_name, :language, :register_number, now(), :hakemus_type, :parent_id
                     FROM form_submissions submissions
                     WHERE id = :form_submission AND version_closed IS NULL
                     RETURNING *"
                  params))]
    {:hakemus hakemus :submission submission}))

(defn- get-talousarvio [id entity]
  (query (str "SELECT mh.amount, m.type, m.translation_fi, m.translation_sv
               FROM virkailija.menoluokka_" entity " as mh, virkailija.menoluokka as m
               WHERE m.id = mh.menoluokka_id AND mh." entity "_id = ?")
         [id]))

(defn store-normalized-hakemus [tx id hakemus answers]
  (let [contact-person (form-util/find-answer-value answers "applicant-name")
        contact-email  (form-util/find-answer-value answers "primary-email")
        contact-phone  (form-util/find-answer-value answers "textField-0")]
    (if (and contact-person contact-email contact-phone)
      (do
        (log/info (str "Storing normalized fields for hakemus: " id))
        (execute! tx
                  "INSERT INTO virkailija.normalized_hakemus (
            hakemus_id,
            project_name,
            contact_person,
            contact_email,
            contact_phone,
            organization_name,
            register_number,
            trusted_contact_name,
            trusted_contact_email,
            trusted_contact_phone
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (hakemus_id) DO UPDATE SET
            project_name = EXCLUDED.project_name,
            contact_person = EXCLUDED.contact_person,
            contact_email = EXCLUDED.contact_email,
            contact_phone = EXCLUDED.contact_phone,
            organization_name = EXCLUDED.organization_name,
            register_number = EXCLUDED.register_number,
            trusted_contact_name = EXCLUDED.trusted_contact_name,
            trusted_contact_email = EXCLUDED.trusted_contact_email,
            trusted_contact_phone = EXCLUDED.trusted_contact_phone"
                  [id,
                   (form-util/find-answer-value answers "project-name"),
                   contact-person,
                   contact-email,
                   contact-phone,
                   (:organization_name hakemus),
                   (:register_number hakemus)
                   (form-util/find-answer-value answers "trusted-contact-name")
                   (form-util/find-answer-value answers "trusted-contact-email")
                   (form-util/find-answer-value answers "trusted-contact-phone")])
        (log/info (str "Succesfully stored normalized fields for hakemus with id: " id)))
      (log/info (str "Skipping normalized_hakemus for incomplete hakemus: " id)))))

(defn extract-yhteishanke-organizations [answers]
  (let [fieldset-value (form-util/find-answer-value answers "other-organizations")]
    (when (seq fieldset-value)
      (let [find-child-value (fn [children key-suffix]
                               (->> children
                                    (filter #(clojure.string/ends-with? (:key %) key-suffix))
                                    first
                                    :value))]
        (->> fieldset-value
             (map (fn [child]
                    (let [children (:value child)]
                      {:organization-name (find-child-value children ".name")
                       :contact-person    (find-child-value children ".contactperson")
                       :email             (find-child-value children ".email")})))
             (filter #(some seq (vals %))))))))

(defn store-yhteishanke-organizations [tx hakemus-id answers]
  (when (feature-enabled? :enableYhteishankeEmails)
    (log/info (str "Storing yhteishanke organizations for hakemus: " hakemus-id))
    (execute! tx
              "DELETE FROM virkailija.yhteishanke_organization WHERE hakemus_id = ?"
              [hakemus-id])
    (let [organizations (extract-yhteishanke-organizations answers)]
      (when (seq organizations)
        (doseq [org organizations]
          (execute! tx
                    "INSERT INTO virkailija.yhteishanke_organization
                     (hakemus_id, organization_name, contact_person, email)
                     VALUES (?, ?, ?, ?)"
                    [hakemus-id
                     (:organization-name org)
                     (:contact-person org)
                     (:email org)])))
      (log/info (str "Successfully stored yhteishanke organizations for hakemus: " hakemus-id)))))

(defn- get-current-submission-answers [hakemus]
  (let [submission-id (or (:form_submission_id hakemus) (:form-submission-id hakemus))]
    (when submission-id
      (:answers (first (query-original-identifiers
                        "SELECT answers FROM hakija.form_submissions WHERE id = ? AND version_closed IS NULL"
                        [submission-id]))))))

(defn get-or-create-yhteishanke-organizations [hakemus]
  (let [hakemus-id (:id hakemus)
        existing (hakemus-copy/get-yhteishanke-organizations hakemus-id)]
    (if (seq existing)
      existing
      (let [answers (get-current-submission-answers hakemus)
            organizations (when answers (extract-yhteishanke-organizations answers))]
        (when (seq organizations)
          (with-tx (fn [tx]
                     (store-yhteishanke-organizations tx hakemus-id answers)))
          (hakemus-copy/get-yhteishanke-organizations hakemus-id))))))

(defn get-yhteishanke-organizations-for-muutoshakemus [user-key]
  (when (feature-enabled? :enableYhteishankeEmails)
    (when-let [hakemus (get-hakemus user-key)]
      (let [answers (get-current-submission-answers hakemus)
            is-yhteishanke (boolean (and answers
                                         (= "yes" (form-util/find-answer-value answers "combined-effort"))))
            organizations (or (get-or-create-yhteishanke-organizations hakemus) [])]
        {:is-yhteishanke is-yhteishanke
         :organizations organizations}))))

(defn get-yhteishanke-organization-emails [hakemus]
  (->> (get-or-create-yhteishanke-organizations hakemus)
       (map :email)
       (remove clojure.string/blank?)
       distinct
       vec))

(defn update-normalized-hakemus-valiselvitys-emails! [tx hakemus-id answers]
  "Update valiselvitys email columns in normalized_hakemus"
  (log/info (str "Updating valiselvitys emails for hakemus: " hakemus-id))
  (let [contact-email (form-util/find-answer-value answers "primary-email")
        organization-email (form-util/find-answer-value answers "organization-email")]
    (execute! tx
              "UPDATE virkailija.normalized_hakemus
               SET valiselvitys_contact_email = ?,
                   valiselvitys_organization_email = ?
               WHERE hakemus_id = ?"
              [contact-email organization-email hakemus-id])))

(defn update-normalized-hakemus-loppuselvitys-emails! [tx hakemus-id answers]
  "Update loppuselvitys email columns in normalized_hakemus"
  (log/info (str "Updating loppuselvitys emails for hakemus: " hakemus-id))
  (let [contact-email (form-util/find-answer-value answers "primary-email")
        organization-email (form-util/find-answer-value answers "organization-email")]
    (execute! tx
              "UPDATE virkailija.normalized_hakemus
               SET loppuselvitys_contact_email = ?,
                   loppuselvitys_organization_email = ?
               WHERE hakemus_id = ?"
              [contact-email organization-email hakemus-id])))

(defn- ensure-normalized-hakemus-exists [tx hakemus-id]
  (let [exists? (first (query tx "SELECT 1 FROM virkailija.normalized_hakemus WHERE hakemus_id = ?" [hakemus-id]))]
    (when-not exists?
      (log/info (str "Creating missing normalized_hakemus row for hakemus: " hakemus-id))
      (let [hakemus (first (query-original-identifiers tx "SELECT * FROM hakemukset WHERE id = ? AND version_closed IS NULL" [hakemus-id]))
            submission (first (query-original-identifiers tx "SELECT answers FROM form_submissions WHERE id = ? AND version_closed IS NULL" [(:form_submission_id hakemus)]))
            answers (:answers submission)
            ;; Check if we have all required fields for normalized_hakemus
            contact-person (form-util/find-answer-value answers "applicant-name")
            contact-email (form-util/find-answer-value answers "primary-email")
            contact-phone (form-util/find-answer-value answers "textField-0")
            organization-name (:organization_name hakemus)
            register-number (:register_number hakemus)
            has-required-fields? (and contact-person contact-email contact-phone
                                      organization-name register-number)]
        (if has-required-fields?
          (store-normalized-hakemus tx hakemus-id hakemus answers)
          (log/info (str "Skipping normalized_hakemus creation for incomplete hakemus: " hakemus-id)))))))

(defn get-normalized-hakemus [user-key]
  (log/info (str "hakija/db Get normalized hakemus with user-key: " user-key))
  (let [hakemus-id (-> (first (query "SELECT id FROM hakija.hakemukset WHERE user_key = ? LIMIT 1" [user-key]))
                       :id)]
    (when hakemus-id
      (with-tx (fn [tx] (ensure-normalized-hakemus-exists tx hakemus-id)))
      (let [hakemus (first
                     (query " SELECT
                                h.id,
                                h.hakemus_id,
                                h.contact_person,
                                h.contact_email,
                                h.contact_phone,
                                h.project_name,
                                h.created_at,
                                h.updated_at,
                                h.organization_name,
                                h.register_number,
                                h.trusted_contact_name,
                                h.trusted_contact_email,
                                h.trusted_contact_phone,
                                h.valiselvitys_contact_email,
                                h.valiselvitys_organization_email,
                                h.loppuselvitys_contact_email,
                                h.loppuselvitys_organization_email
                              FROM virkailija.normalized_hakemus as h
                              WHERE h.hakemus_id = ?"
                            [hakemus-id]))
            talousarvio (when hakemus (get-talousarvio (:hakemus-id hakemus) "hakemus"))]
        (log/info (str "Succesfully fetched hakemus with user-key: " user-key))
        (when hakemus
          (into {} (filter (comp some? val) {:id (:id hakemus)
                                             :hakemus-id (:hakemus-id hakemus)
                                             :updated-at (:updated-at hakemus)
                                             :created-at (:created-at hakemus)
                                             :project-name (:project-name hakemus)
                                             :contact-person (:contact-person hakemus)
                                             :contact-email (:contact-email hakemus)
                                             :contact-phone (:contact-phone hakemus)
                                             :organization-name (:organization-name hakemus)
                                             :register-number (:register-number hakemus)
                                             :talousarvio talousarvio
                                             :trusted-contact-name (get-in hakemus [:trusted-contact-name])
                                             :trusted-contact-email (get-in hakemus [:trusted-contact-email])
                                             :trusted-contact-phone (get-in hakemus [:trusted-contact-phone])
                                             :valiselvitys-contact-email (get-in hakemus [:valiselvitys-contact-email])
                                             :valiselvitys-organization-email (get-in hakemus [:valiselvitys-organization-email])
                                             :loppuselvitys-contact-email (get-in hakemus [:loppuselvitys-contact-email])
                                             :loppuselvitys-organization-email (get-in hakemus [:loppuselvitys-organization-email])})))))))

(defn create-muutoshakemus-url [va-url avustushaku-id user-key]
  (let [url-parameters  (form-encode {:user-key user-key :avustushaku-id avustushaku-id})]
    (str va-url "muutoshakemus?" url-parameters)))

(defn get-muutoshakemus-url-by-hakemus-id [id]
  (let [hakemukset (query "SELECT user_key, avustushaku from hakija.hakemukset WHERE id = ?" [id])
        hakemus (first hakemukset)
        va-url (get-in config [:server :url :fi])
        muutoshakemus-url (create-muutoshakemus-url va-url (:avustushaku hakemus) (:user-key hakemus))]
    muutoshakemus-url))

(defn get-normalized-hakemus-by-id [id]
  (log/info (str "Get normalized hakemus with id: " id))
  (let [hakemukset (query "
         SELECT
          id,
          hakemus_id,
          contact_person,
          contact_email,
          contact_phone,
          project_name,
          created_at,
          updated_at,
          organization_name,
          register_number,
          trusted_contact_name,
          trusted_contact_email,
          trusted_contact_phone,
          valiselvitys_contact_email,
          valiselvitys_organization_email,
          loppuselvitys_contact_email,
          loppuselvitys_organization_email
          from virkailija.normalized_hakemus WHERE hakemus_id = ?" [id])
        hakemus (into {} (filter (comp some? val) (first hakemukset)))
        talousarvio (when hakemus (get-talousarvio (:hakemus-id hakemus) "hakemus"))]
    (log/info (str "Succesfully fetched hakemus with id: " id))
    (if (and hakemus (count talousarvio))
      (assoc hakemus :talousarvio talousarvio)
      hakemus)))

(defn get-paatos [user-key]
  (let [paatokset (query "SELECT
                            id,
                            -- Tää toimii ns. oikein eli wanhalla tavalla kun kaikille osioille on
                            -- annettu sama hyväksytty/hylätty päätös
                            coalesce(pj.status, pt.status, ps.status) as status,
                            pj.status as paatos_status_jatkoaika,
                            pt.status as paatos_status_talousarvio,
                            ps.status as paatos_status_sisaltomuutos,
                            user_key,
                            reason,
                            created_at,
                            updated_at,
                            decider,
                            to_char(pj.paattymispaiva, 'YYYY-MM-DD') as paattymispaiva
                          FROM virkailija.paatos
                          LEFT JOIN virkailija.paatos_jatkoaika pj ON (pj.paatos_id = paatos.id)
                          LEFT JOIN virkailija.paatos_talousarvio pt ON (pt.paatos_id = paatos.id)
                          LEFT JOIN virkailija.paatos_sisaltomuutos ps ON (ps.paatos_id = paatos.id)
                          WHERE user_key = ?" [user-key])
        paatos (first paatokset)
        talousarvio (when paatos (get-talousarvio (:id paatos) "paatos"))]
    (if (and paatos (count talousarvio))
      (assoc paatos :talousarvio talousarvio)
      paatos)))

(defn- get-muutoshakemus-yhteishanke-organizations [muutoshakemus-id]
  (query "SELECT organization_name, contact_person, email
          FROM virkailija.muutoshakemus_yhteishanke_organization
          WHERE muutoshakemus_id = ?
          ORDER BY position, id"
         [muutoshakemus-id]))

(defn get-muutoshakemukset [hakemus-id]
  (let [basic-muutoshakemukset (query
                                "SELECT
                                  m.id,
                                  m.hakemus_id,
                                  (CASE
                                    WHEN m.paatos_id IS NULL
                                    THEN 'new'
                                    ELSE
                                      -- Tää toimii ns. oikein eli wanhalla tavalla kun kaikille osioille on
                                      -- annettu sama hyväksytty/hylätty päätös
                                      coalesce(pj.status, ps.status, pt.status)::text
                                  END) as status,
                                  pj.status as paatos_status_jatkoaika,
                                  pt.status as paatos_status_talousarvio,
                                  ps.status as paatos_status_sisaltomuutos,
                                  haen_kayttoajan_pidennysta,
                                  kayttoajan_pidennys_perustelut,
                                  haen_sisaltomuutosta,
                                  sisaltomuutos_perustelut,
                                  m.created_at,
                                  to_char(haettu_kayttoajan_paattymispaiva, 'YYYY-MM-DD') as haettu_kayttoajan_paattymispaiva,
                                  talousarvio_perustelut,
                                  p.id as paatos_id,
                                  p.reason as paatos_reason,
                                  p.user_key as paatos_user_key,
                                  to_char(pj.paattymispaiva, 'YYYY-MM-DD') as paatos_hyvaksytty_paattymispaiva,
                                  p.created_at as paatos_created_at,
                                  ee.created_at as paatos_sent_at
                                FROM virkailija.muutoshakemus m
                                LEFT JOIN virkailija.paatos p ON m.paatos_id = p.id
                                LEFT JOIN virkailija.paatos_jatkoaika pj ON pj.paatos_id = p.id
                                LEFT JOIN virkailija.paatos_talousarvio pt ON pt.paatos_id = p.id
                                LEFT JOIN virkailija.paatos_sisaltomuutos ps ON ps.paatos_id = p.id
                                LEFT JOIN virkailija.email_event ee ON m.id = ee.muutoshakemus_id AND ee.email_type = 'muutoshakemus-paatos' AND success = true
                                WHERE m.hakemus_id = ?
                                ORDER BY id DESC" [hakemus-id])
        muutoshakemukset-talousarvio (map #(assoc % :talousarvio (get-talousarvio (:id %) "muutoshakemus")) basic-muutoshakemukset)
        muutoshakemukset-paatos-talousarvio (map #(assoc % :paatos-talousarvio (get-talousarvio (:paatos-id %) "paatos")) muutoshakemukset-talousarvio)
        muutoshakemukset-yhteishanke (if (feature-enabled? :enableYhteishankeEmails)
                                       (map #(let [orgs (get-muutoshakemus-yhteishanke-organizations (:id %))]
                                               (if (seq orgs)
                                                 (assoc % :yhteishanke-osapuolimuutokset orgs)
                                                 %))
                                            muutoshakemukset-paatos-talousarvio)
                                       muutoshakemukset-paatos-talousarvio)
        muutoshakemukset (map #(dissoc % :paatos-id) muutoshakemukset-yhteishanke)]
    muutoshakemukset))

(defn get-muutoshakemukset-by-paatos-user-key [user-key]
  (let [hakemus-id-rows (query "SELECT h.*
                                FROM paatos p
                                LEFT JOIN muutoshakemus mh ON mh.paatos_id = p.id
                                LEFT JOIN hakemukset h ON h.id = mh.hakemus_id
                                WHERE p.user_key = ?
                                LIMIT 1" [user-key])
        hakemus-id (:id (first hakemus-id-rows))]
    (get-muutoshakemukset hakemus-id)))

(defn get-muutoshakemukset-by-user-key [user-key]
  (let [hakemus-id-rows (query "SELECT id FROM hakemukset WHERE user_key = ? LIMIT 1" [user-key])
        hakemus-id (:id (first hakemus-id-rows))]
    (get-muutoshakemukset hakemus-id)))

(defn get-avustushaku-by-paatos-user-key [user-key]
  (let [avustushaut (query "SELECT a.id, a.hankkeen_alkamispaiva, a.hankkeen_paattymispaiva
                                FROM virkailija.muutoshakemus mh
                                LEFT JOIN virkailija.paatos p on mh.paatos_id = p.id
                                LEFT JOIN hakija.hakemukset h on mh.hakemus_id = h.id
                                LEFT JOIN hakija.avustushaut a on h.avustushaku = a.id
                                WHERE h.version_closed IS NULL
                                AND p.user_key = ?" [user-key])]
    (first avustushaut)))

(defn get-valmistelija-assigned-to-hakemus [hakemus-id]
  (let [sql "SELECT ahr.name, ahr.email, ahr.oid
             FROM hakija.hakemukset hv
             JOIN virkailija.arviot a ON a.hakemus_id = hv.id
             JOIN hakija.avustushaku_roles ahr ON a.presenter_role_id = ahr.id
             WHERE hv.version_closed IS NULL AND hv.id = ?"
        result (first (query sql [hakemus-id]))]
    (log/info "Found valmistelija" result  "for hakemus ID" hakemus-id)
    result))

(defn- add-muutoshakemus [tx user-key hakemus-id muutoshakemus]
  (log/info (str "Inserting muutoshakemus for user-key: " user-key))
  (let [haen-kayttoajan-pidennysta (get-in muutoshakemus [:jatkoaika :haenKayttoajanPidennysta] false)
        haen-sisaltomuutosta (get-in muutoshakemus [:sisaltomuutos :haenSisaltomuutosta] false)
        sisaltomuutos-perustelut (get-in muutoshakemus [:sisaltomuutos :sisaltomuutosPerustelut])
        kayttoajan-pidennys-perustelut (get-in muutoshakemus [:jatkoaika :kayttoajanPidennysPerustelut])
        haettu-kayttoajan-paattymispaiva (get-in muutoshakemus [:jatkoaika :haettuKayttoajanPaattymispaiva])
        talousarvio-perustelut (:talousarvioPerustelut muutoshakemus)
        id-rows (query tx
                       "INSERT INTO virkailija.muutoshakemus
                            (hakemus_id, haen_kayttoajan_pidennysta, kayttoajan_pidennys_perustelut, haettu_kayttoajan_paattymispaiva, talousarvio_perustelut, haen_sisaltomuutosta, sisaltomuutos_perustelut)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        RETURNING id"
                       [hakemus-id haen-kayttoajan-pidennysta kayttoajan-pidennys-perustelut haettu-kayttoajan-paattymispaiva talousarvio-perustelut, haen-sisaltomuutosta, sisaltomuutos-perustelut])]
    (:id (first id-rows))))

(defn- add-muutoshakemus-menoluokkas [tx muutoshakemus-id avustushaku-id talousarvio]
  (doseq [[type amount] (seq talousarvio)]
    (execute! tx
              "INSERT INTO menoluokka_muutoshakemus (menoluokka_id, muutoshakemus_id, amount)
       VALUES ((SELECT id FROM menoluokka WHERE avustushaku_id = ? AND type = ?), ?, ?)"
              [avustushaku-id (name type) muutoshakemus-id amount])))

(defn- add-muutoshakemus-yhteishanke-organizations [tx muutoshakemus-id organizations]
  (when (and (feature-enabled? :enableYhteishankeEmails) (seq organizations))
    (log/info (str "Storing yhteishanke organization structure change for muutoshakemus: " muutoshakemus-id))
    (doseq [[position organization] (map-indexed vector organizations)]
      (execute! tx
                "INSERT INTO virkailija.muutoshakemus_yhteishanke_organization
                 (muutoshakemus_id, position, organization_name, contact_person, email)
                 VALUES (?, ?, ?, ?, ?)"
                [muutoshakemus-id
                 position
                 (:organizationName organization)
                 (:contactPerson organization)
                 (:email organization)]))
    (log/info (str "Stored yhteishanke organization structure change for muutoshakemus: " muutoshakemus-id))))

(defn- change-normalized-hakemus-contact-person-details [tx user-key hakemus-id contact-person-details]
  (log/info (str "Change normalized contact person details with user-key: " user-key))
  (ensure-normalized-hakemus-exists tx hakemus-id)
  (let [contact-person (:name contact-person-details)
        contact-phone (:phone contact-person-details)
        contact-email (:email contact-person-details)]
    (execute! tx
              "UPDATE virkailija.normalized_hakemus SET
      contact_person = ?, contact_email = ?, contact_phone = ? WHERE hakemus_id = ?"
              [contact-person contact-email contact-phone hakemus-id]))
  (log/info (str "Succesfully changed contact person details with user-key: " user-key)))

(defn- change-normalized-hakemus-trusted-contact-person-details [tx user-key hakemus-id contact]
  (log/info (str "Change normalized trusted contact person details with user-key: " user-key))
  (ensure-normalized-hakemus-exists tx hakemus-id)
  (let [contact-name (:name contact)
        contact-phone (:phone contact)
        contact-email (:email contact)]
    (execute! tx
              "UPDATE virkailija.normalized_hakemus SET
               trusted_contact_name = ?, trusted_contact_email = ?, trusted_contact_phone = ? WHERE hakemus_id = ?"
              [contact-name contact-email contact-phone hakemus-id]))
  (log/info (str "Successfully changed trusted contact person details with user-key: " user-key)))

(defn- get-yhteishanke-organization-ids [tx hakemus-id]
  (map :id
       (query tx
              "SELECT id
               FROM virkailija.yhteishanke_organization
               WHERE hakemus_id = ?
               ORDER BY id"
              [hakemus-id])))

(defn- update-yhteishanke-organization-contacts [tx hakemus-id organizations]
  (when (feature-enabled? :enableYhteishankeEmails)
    (log/info (str "Updating yhteishanke organization contacts for hakemus: " hakemus-id))
    (let [organization-ids (vec (get-yhteishanke-organization-ids tx hakemus-id))]
      (when (not= (count organization-ids) (count organizations))
        (log/warn (str "Yhteishanke organization contact update row count mismatch for hakemus: "
                       hakemus-id
                       ", expected rows: "
                       (count organization-ids)
                       ", got updates: "
                       (count organizations))))
      (doseq [[organization-id organization] (map vector organization-ids organizations)]
        (execute! tx
                  "UPDATE virkailija.yhteishanke_organization
                 SET contact_person = ?, email = ?
                 WHERE id = ? AND hakemus_id = ?"
                  [(:contactPerson organization)
                   (:email organization)
                   organization-id
                   hakemus-id])))
    (log/info (str "Successfully updated yhteishanke organization contacts for hakemus: " hakemus-id))))

(defn on-muutoshakemus [user-key hakemus-id avustushaku-id muutoshakemus]
  (with-tx (fn [tx]
             (let [requires-muutoshakemus? (or (:talousarvio muutoshakemus)
                                               (get-in muutoshakemus [:jatkoaika :haenKayttoajanPidennysta])
                                               (get-in muutoshakemus [:sisaltomuutos :haenSisaltomuutosta])
                                               (contains? muutoshakemus :yhteishankkeenOsapuolimuutokset))
                   muutoshakemus-id (when requires-muutoshakemus?
                                      (add-muutoshakemus tx user-key hakemus-id muutoshakemus))]
               (when (:talousarvio muutoshakemus)
                 (add-muutoshakemus-menoluokkas tx muutoshakemus-id avustushaku-id (:talousarvio muutoshakemus)))
               (when (contains? muutoshakemus :yhteishankkeenOsapuolimuutokset)
                 (add-muutoshakemus-yhteishanke-organizations tx
                                                              muutoshakemus-id
                                                              (get muutoshakemus :yhteishankkeenOsapuolimuutokset))))
             (when (contains? muutoshakemus :yhteyshenkilo)
               (change-normalized-hakemus-contact-person-details tx user-key hakemus-id (get muutoshakemus :yhteyshenkilo)))
             (when (contains? muutoshakemus :varayhteyshenkilo)
               (change-normalized-hakemus-trusted-contact-person-details tx user-key hakemus-id (get muutoshakemus :varayhteyshenkilo)))
             (when (contains? muutoshakemus :yhteishankkeenOsapuolet)
               (update-yhteishanke-organization-contacts tx hakemus-id (get muutoshakemus :yhteishankkeenOsapuolet))))))

(defn update-hakemus-tx [tx avustushaku-id user-key submission-version answers budget-totals hakemus]
  (let [register-number (or (:register_number hakemus)
                            (generate-register-number avustushaku-id))
        new-hakemus (hakemus-copy/create-new-hakemus-version tx (:id hakemus))
        params (-> {:avustushaku_id avustushaku-id
                    :user_key user-key
                    :version (:version new-hakemus)
                    :user_oid nil
                    :user_first_name nil
                    :user_last_name nil
                    :user_email nil
                    :register_number register-number
                    :form_submission_id (:form_submission_id hakemus)
                    :form_submission_version submission-version}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params answers))]
    (first
     (named-query tx
                  "UPDATE hakemukset SET
           avustushaku = :avustushaku_id, user_key = :user_key,
           form_submission_id = :form_submission_id, form_submission_version = :form_submission_version,
           user_oid = :user_oid, user_first_name = :user_first_name,
           user_last_name = :user_last_name, user_email = :user_email,
           budget_total = :budget_total, budget_oph_share = :budget_oph_share,
           organization_name = :organization_name, project_name = :project_name,
           language = :language, register_number = :register_number,
           business_id = :business_id, owner_type = :owner_type
         WHERE user_key = :user_key AND form_submission_id = :form_submission_id
           AND version_closed IS NULL AND version = :version
         RETURNING *"
                  params))))

(defn- update-status
  [tx avustushaku-id user-key submission-id submission-version register-number answers budget-totals status status-change-comment]
  (let [new-hakemus (hakemus-copy/create-new-hakemus-version-from-user-key-form-submission-id tx user-key submission-id)
        params (-> {:avustushaku_id avustushaku-id
                    :version (:version new-hakemus)
                    :user_key user-key
                    :user_oid nil
                    :user_first_name nil
                    :user_last_name nil
                    :user_email nil
                    :form_submission_id submission-id
                    :form_submission_version submission-version
                    :register_number register-number
                    :status status
                    :status_change_comment status-change-comment}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params answers))]
    (first
     (named-query tx
                  "UPDATE hakemukset SET
           avustushaku = :avustushaku_id, user_key = :user_key,
           form_submission_id = :form_submission_id, form_submission_version = :form_submission_version,
           budget_total = :budget_total, budget_oph_share = :budget_oph_share,
           organization_name = :organization_name, project_name = :project_name,
           language = :language, register_number = :register_number,
           user_oid = :user_oid, user_first_name = :user_first_name,
           user_last_name = :user_last_name, user_email = :user_email,
           status = :status, status_change_comment = :status_change_comment,
           last_status_change_at = now()
         WHERE user_key = :user_key AND form_submission_id = :form_submission_id
           AND version_closed IS NULL AND version = :version
         RETURNING *"
                  params))))

(defn- new-update-status
  [tx avustushaku-id hakemus submission-version answers budget-totals status status-change-comment user-key]
  (let [new-hakemus (hakemus-copy/create-new-hakemus-version tx (:id hakemus))
        params (-> {:avustushaku_id avustushaku-id
                    :version (:version new-hakemus)
                    :user_key user-key
                    :user_oid nil
                    :user_first_name nil
                    :user_last_name nil
                    :user_email nil
                    :form_submission_id (:form_submission_id hakemus)
                    :form_submission_version submission-version
                    :register_number (:register_number hakemus)
                    :status status
                    :status_change_comment status-change-comment}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params answers))]
    (named-execute! tx
                    "UPDATE hakemukset SET
         avustushaku = :avustushaku_id, user_key = :user_key,
         form_submission_id = :form_submission_id, form_submission_version = :form_submission_version,
         budget_total = :budget_total, budget_oph_share = :budget_oph_share,
         organization_name = :organization_name, project_name = :project_name,
         language = :language, register_number = :register_number,
         user_oid = :user_oid, user_first_name = :user_first_name,
         user_last_name = :user_last_name, user_email = :user_email,
         status = :status, status_change_comment = :status_change_comment,
         last_status_change_at = now()
       WHERE user_key = :user_key AND form_submission_id = :form_submission_id
         AND version_closed IS NULL AND version = :version"
                    params)
    new-hakemus))

(defn open-hakemus-applicant-edit [avustushaku-id hakemus submission-version answers budget-totals hakemus-id]
  (with-tx (fn [tx] (new-update-status tx avustushaku-id hakemus submission-version answers budget-totals :applicant_edit nil hakemus-id))))

(defn set-submitted-version [tx params]
  (first
   (query-original-identifiers tx
                               "UPDATE hakemukset SET submitted_version = version
       WHERE user_key = ? AND form_submission_id = ? AND version = ? AND version_closed IS NULL
       RETURNING *"
                               [(:user_key params) (:form_submission_id params) (:version params)])))

(defn verify-hakemus [avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals]
  (with-tx #(update-status % avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals :draft nil)))

(defn submit-hakemus [tx avustushaku-id hakemus submission-version  answers budget-totals user-key]
  (->> (new-update-status tx avustushaku-id hakemus submission-version answers budget-totals :submitted nil user-key)
       :version
       (assoc {:user_key user-key :form_submission_id (:form_submission_id hakemus)} :version)
       (set-submitted-version tx)))

(defn cancel-hakemus [avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals comment]
  (with-tx #(update-status % avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals :cancelled comment)))

(defn unrefuse-application [tx id]
  (let [new-hakemus (hakemus-copy/create-new-hakemus-version tx id)]
    (execute! tx "UPDATE hakemukset SET
                refused = null,
                refused_comment = null,
                refused_at = null
              WHERE id = ? AND version = ?" [(:id new-hakemus) (:version new-hakemus)])))

(defn refuse-application [tx id comment]
  (let [new-hakemus (hakemus-copy/create-new-hakemus-version tx id)]
    (execute! tx "UPDATE hakemukset SET
                refused = true,
                refused_comment = ?,
                refused_at = now()
              WHERE id = ? AND version = ?" [comment (:id new-hakemus) (:version new-hakemus)])))

(defn update-loppuselvitys-status [hakemus-id status]
  (execute!
   "update hakemukset set status_loppuselvitys = ? where id = ? and version_closed is null"
   [status hakemus-id]))

(defn update-valiselvitys-status [hakemus-id status]
  (execute!
   "update hakemukset set status_valiselvitys = ? where id = ? and version_closed is null"
   [status hakemus-id]))

(defn attachment-exists? [hakemus-id field-id]
  (first
   (query-original-identifiers
    "select 1 from attachments where hakemus_id = ? and field_id = ?"
    [hakemus-id field-id])))

(defn attachment-exists-and-is-not-closed? [hakemus-id field-id]
  (first (query "SELECT true
    FROM attachments
      WHERE hakemus_id = ?
      AND field_id = ?
      AND version_closed is null
      LIMIT 1", [hakemus-id, field-id])))

(defn convert-attachment [hakemus-id attachment]
  {:id (:id attachment)
   :hakemus-id hakemus-id
   :version (:version attachment)
   :field-id (:field_id attachment)
   :file-size (:file_size attachment)
   :content-type (:content_type attachment)
   :hakemus-version (:hakemus_version attachment)
   :created-at (:created_at attachment)
   :filename (:filename attachment)})

(defn create-attachment [hakemus-id hakemus-version field-id filename content-type size file]
  (let [blob (slurp-binary-file! file)]
    (if (attachment-exists? hakemus-id field-id)
      (with-tx (fn [tx]
                 (execute! tx
                           "update attachments set version_closed = now()
           where hakemus_id = ? and field_id = ? and version_closed is null"
                           [hakemus-id field-id])
                 (first
                  (named-query tx
                               "insert into attachments (id, version, hakemus_id, hakemus_version, field_id, filename, content_type, file_size, file_data)
             select id, max(version) + 1, :hakemus_id, :hakemus_version, :field_id, :filename, :content_type, :file_size, :file_data
             from attachments where hakemus_id = :hakemus_id and field_id = :field_id group by id
             RETURNING *"
                               {:hakemus_id hakemus-id :hakemus_version hakemus-version :field_id field-id
                                :filename filename :content_type content-type :file_size size :file_data blob}))))
      (first
       (named-query
        "insert into attachments (version, hakemus_id, hakemus_version, field_id, filename, content_type, file_size, file_data)
           values (0, :hakemus_id, :hakemus_version, :field_id, :filename, :content_type, :file_size, :file_data)
           RETURNING *"
        {:hakemus_id hakemus-id :hakemus_version hakemus-version :field_id field-id
         :filename filename :content_type content-type :file_size size :file_data blob})))))

(defn close-existing-attachment! [hakemus-id field-id]
  (execute!
   "update attachments set version_closed = now()
     where hakemus_id = ? and field_id = ? and version_closed is null"
   [hakemus-id field-id]))

(defn list-attachments [hakemus-id]
  (query-original-identifiers
   "select id, version, hakemus_id, hakemus_version, created_at, field_id, filename, file_size, content_type
     from attachments
     where hakemus_id = ? and version_closed is null"
   [hakemus-id]))

(defn get-attachments [external-hakemus-id hakemus-id]
  (->> (list-attachments hakemus-id)
       (map (partial convert-attachment external-hakemus-id))
       (map (fn [attachment] [(:field-id attachment) attachment]))
       (into {})))

(defn download-attachment [hakemus-id field-id]
  (let [result (first
                (query-original-identifiers
                 "select file_size, content_type, filename, file_data from attachments
                    where hakemus_id = ? and field_id = ? and version_closed is null"
                 [hakemus-id field-id]))]
    {:data (io/input-stream (:file_data result))
     :content-type (:content_type result)
     :filename (:filename result)
     :size (:file_size result)}))

(defn valid-token? [token application-id]
  (and
   (some? token)
   (not
    (empty?
     (query-original-identifiers
      "SELECT id, application_id, token FROM hakija.application_tokens
        WHERE application_id = ? AND token = ? AND revoked IS NOT TRUE"
      [application-id token])))))

(defn valid-user-key-token? [token user-key]
  (let [application (get-hakemus user-key)]
    (and
     (some? application)
     (valid-token? token (:id application)))))

(defn revoke-token [token]
  (execute!
   "UPDATE hakija.application_tokens SET revoked = TRUE WHERE token = ?"
   [token]))

(defn get-loppuselvitys-hakemus-id [parent-hakemus-id]
  (let [result (query "
                      SELECT id FROM hakemukset
                      WHERE hakemus_type = 'loppuselvitys' AND
                            parent_id = ? AND
                            version_closed IS NULL
                    " [parent-hakemus-id])]
    (:id (first result))))
