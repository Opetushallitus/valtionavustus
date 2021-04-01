(ns oph.va.hakija.db
  (:use [oph.soresu.common.db]
        [oph.soresu.form.db :as form-db]
        [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [clojure.tools.logging :as log]
            [oph.soresu.common.db :refer [exec get-datasource with-tx query execute!]]
            [clojure.java.jdbc :as jdbc]
            [oph.soresu.common.jdbc.extensions :refer :all]
            [oph.soresu.form.formutil :as form-util]
            [oph.va.jdbc.extensions :refer :all]
            [oph.va.hakija.db.queries :as queries]))

(defn slurp-binary-file! [file]
  (io! (with-open [reader (io/input-stream file)]
         (let [buffer (byte-array (.length file))]
           (.read reader buffer)
           buffer))))

(defn health-check []
  (->> {}
       (exec queries/health-check)
       first
       :?column?
       (= 1)))

(defn junction-hackathon-dump []
  (->> {}
       (exec queries/junction-hackathon-dump)
       first
       :dump))

(defn get-avustushaku [id]
  (->> (exec queries/get-avustushaku {:id id})
       first))

(defn get-avustushaku-roles [avustushaku-id]
  (exec queries/get-avustushaku-roles {:avustushaku avustushaku-id}))

(defn list-avustushaut []
  (exec queries/list-avustushaut {}))


(defn add-paatos-view [hakemus-id headers remote-addr]
  (exec queries/create-paatos-view! {:hakemus_id hakemus-id :headers headers :remote_addr remote-addr}))

(defn- pluck-key [answers key as default]
  (let [value (or (form-util/find-answer-value answers key) default)]
    {as value}))

(defn- get-organization-name [answers] (pluck-key answers "organization" :organization_name ""))
(defn- get-project-name [answers] (pluck-key answers "project-name" :project_name ""))
(defn- get-language [answers] (pluck-key answers "language" :language "fi"))

(defn- merge-calculated-params [params avustushaku-id answers]
  (merge params
         (get-organization-name answers)
         (get-project-name answers)
         (get-language answers)))

(defn get-hakemus [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec queries/get-hakemus-by-user-id)
       first))

(defn get-hakemus-version [hakemus-id version]
  (first
    (exec queries/get-hakemus-version-by-user-id
          {:user_key hakemus-id :version version})))

(defn get-hakemus-paatos [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec queries/get-hakemus-paatokset)
       first))

(defn list-hakemus-change-requests [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec queries/list-hakemus-change-requests-by-user-id)))

(defn find-hakemus-by-parent-id-and-type [parent-id hakemus-type]
  (->> {:parent_id parent-id :hakemus_type hakemus-type}
       (exec queries/find-by-parent-id-and-hakemus-type) first))

(defn- register-number-sequence-exists? [register-number]
  (->> (exec queries/register-number-sequence-exists? {:suffix register-number})
       first
       nil?
       not))

(defn generate-register-number [avustushaku-id user-key]
  (if-let [avustushaku-register-number (-> (get-avustushaku avustushaku-id) :register_number)]
    (when (re-matches #"\d+/\d+" avustushaku-register-number)
      (let [params {:suffix avustushaku-register-number}
            {:keys [suffix seq_number]} (if (register-number-sequence-exists? avustushaku-register-number)
                                          (exec queries/update-register-number-sequence<! params)
                                          (exec queries/create-register-number-sequence<! params))]
        (format "%d/%s" seq_number avustushaku-register-number)))))

(defn- convert-budget-totals [budget-totals]
  {:budget_total (or (:total-needed budget-totals) 0)
   :budget_oph_share (or (:oph-share budget-totals) 0)})


(defn create-hakemus! [avustushaku-id form-id answers hakemus-type register-number budget-totals]
  (let [submission (form-db/create-submission! form-id answers)
        user-key (generate-hash-id)
        params (-> {:avustushaku_id avustushaku-id
                    :user_key user-key
                    :form_submission (:id submission)
                    :register_number (if (nil? register-number) (generate-register-number avustushaku-id user-key) register-number)
                    :hakemus_type hakemus-type}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params avustushaku-id answers))
        hakemus (exec queries/create-hakemus<! params)]
    {:hakemus hakemus :submission submission}))

(defn get-normalized-hakemus [user-key]
  (log/info (str "Get normalized hakemus with user-key: " user-key))
  (let [hakemukset (query "SELECT * from virkailija.normalized_hakemus WHERE hakemus_id = (SELECT id FROM hakija.hakemukset WHERE user_key = ? LIMIT 1)" [user-key])]
    (log/info (str "Succesfully fetched hakemus with user-key: " user-key))
    (first hakemukset)))

(defn get-normalized-hakemus-by-id [id]
  (log/info (str "Get normalized hakemus with id: " id))
  (let [hakemukset (query "SELECT * from virkailija.normalized_hakemus WHERE hakemus_id = ?" [id])]
    (log/info (str "Succesfully fetched hakemus with id: " id))
    (first hakemukset)))

(defn get-paatos [user-key]
  (let [paatokset (query "SELECT
                            id,
                            status,
                            user_key,
                            reason,
                            created_at,
                            updated_at,
                            decider,
                            to_char(paattymispaiva, 'YYYY-MM-DD') as paattymispaiva
                          FROM virkailija.paatos
                          WHERE user_key = ?" [user-key])]
    (first paatokset)))

(defn get-muutoshakemus-by-paatos-id [paatos-id]
  (let [muutoshakemukset (query "SELECT
                                  m.id,
                                  m.hakemus_id,
                                  (CASE
                                    WHEN paatos_id IS NULL
                                    THEN 'new'
                                    ELSE p.status::text
                                  END) as status,
                                  haen_kayttoajan_pidennysta,
                                  kayttoajan_pidennys_perustelut,
                                  m.created_at,
                                  to_char(haettu_kayttoajan_paattymispaiva, 'YYYY-MM-DD') as haettu_kayttoajan_paattymispaiva,
                                  p.user_key as paatos_user_key,
                                  to_char(p.paattymispaiva, 'YYYY-MM-DD') as paatos_hyvaksytty_paattymispaiva,
                                  p.created_at as paatos_created_at,
                                  ee.created_at as paatos_sent_at
                                FROM virkailija.muutoshakemus m
                                LEFT JOIN virkailija.paatos p ON m.paatos_id = p.id
                                LEFT JOIN virkailija.email_event ee ON m.id = ee.muutoshakemus_id AND ee.email_type = 'muutoshakemus-paatos' AND success = true
                                WHERE m.paatos_id = ?
                                ORDER BY id DESC" [paatos-id])]
    (first muutoshakemukset)))

(defn get-muutoshakemukset [user-key]
  (let [muutoshakemukset (query "SELECT
                                  m.id,
                                  m.hakemus_id,
                                  (CASE
                                    WHEN paatos_id IS NULL
                                    THEN 'new'
                                    ELSE p.status::text
                                  END) as status,
                                  haen_kayttoajan_pidennysta,
                                  kayttoajan_pidennys_perustelut,
                                  m.created_at,
                                  to_char(haettu_kayttoajan_paattymispaiva, 'YYYY-MM-DD') as haettu_kayttoajan_paattymispaiva,
                                  p.user_key as paatos_user_key,
                                  to_char(p.paattymispaiva, 'YYYY-MM-DD') as paatos_hyvaksytty_paattymispaiva,
                                  p.created_at as paatos_created_at,
                                  ee.created_at as paatos_sent_at
                                FROM virkailija.muutoshakemus m
                                LEFT JOIN virkailija.paatos p ON m.paatos_id = p.id
                                LEFT JOIN virkailija.email_event ee ON m.id = ee.muutoshakemus_id AND ee.email_type = 'muutoshakemus-paatos' AND success = true
                                WHERE m.hakemus_id = (SELECT id FROM hakemukset WHERE user_key = ? LIMIT 1)
                                ORDER BY id DESC" [user-key])]
    muutoshakemukset))

(defn get-muutoshakemukset-by-hakemus-id [hakemus-id]
  (let [muutoshakemukset (query "SELECT
                                  m.id,
                                  m.hakemus_id,
                                  (CASE
                                    WHEN paatos_id IS NULL
                                    THEN 'new'
                                    ELSE p.status::text
                                  END) as status,
                                  haen_kayttoajan_pidennysta,
                                  kayttoajan_pidennys_perustelut,
                                  m.created_at,
                                  to_char(haettu_kayttoajan_paattymispaiva, 'YYYY-MM-DD') as haettu_kayttoajan_paattymispaiva,
                                  p.user_key as paatos_user_key,
                                  to_char(p.paattymispaiva, 'YYYY-MM-DD') as paatos_hyvaksytty_paattymispaiva,
                                  p.created_at as paatos_created_at,
                                  ee.created_at as paatos_sent_at
                                FROM virkailija.muutoshakemus m
                                LEFT JOIN virkailija.paatos p ON m.paatos_id = p.id
                                LEFT JOIN virkailija.email_event ee ON m.id = ee.muutoshakemus_id AND ee.email_type = 'muutoshakemus-paatos' AND success = true
                                WHERE m.hakemus_id = ?
                                ORDER BY id DESC" [hakemus-id])]
    muutoshakemukset))

(defn get-avustushaku-by-paatos-user-key [user-key]
      (let [avustushaut (query "SELECT a.hankkeen_alkamispaiva, a.hankkeen_paattymispaiva
                                FROM virkailija.muutoshakemus mh
                                LEFT JOIN virkailija.paatos p on mh.paatos_id = p.id
                                LEFT JOIN hakija.hakemukset h on mh.hakemus_id = h.id
                                LEFT JOIN hakija.avustushaut a on h.avustushaku = a.id
                                WHERE h.version_closed IS NULL
                                AND p.user_key = ?" [user-key])]
           (first avustushaut)))

(defn get-presenter-by-hakemus-id [hakemus-id]
  (let [presenters (query "SELECT ar.name, ar.email
                           FROM avustushaku_roles ar
                           LEFT JOIN hakemukset h ON ar.avustushaku = h.avustushaku
                           LEFT JOIN muutoshakemus m ON h.id = m.hakemus_id
                           WHERE m.hakemus_id = ?" [hakemus-id])]
    (first presenters)))

(defn add-muutoshakemus [tx user-key jatkoaika]
  (log/info (str "Inserting muutoshakemus for user-key: " user-key))
  (let [ haen-kayttoajan-pidennysta (:haenKayttoajanPidennysta jatkoaika)
         kayttoajan-pidennys-perustelut (:kayttoajanPidennysPerustelut jatkoaika)
         haettu-kayttoajan-paattymispaiva (:haettuKayttoajanPaattymispaiva jatkoaika)]
    (execute! tx
     "INSERT INTO virkailija.muutoshakemus
          (hakemus_id, haen_kayttoajan_pidennysta, kayttoajan_pidennys_perustelut, haettu_kayttoajan_paattymispaiva)
        VALUES
          ((SELECT id FROM hakija.hakemukset WHERE user_key = ? LIMIT 1),?,?,?)"
          [user-key haen-kayttoajan-pidennysta, kayttoajan-pidennys-perustelut, haettu-kayttoajan-paattymispaiva ])
))

(defn- answer->menoluokka-row [answers hakemus-id menoluokka]
  {:menoluokka_id (:id menoluokka)
   :hakemus_id hakemus-id
   :amount (Integer/parseInt (form-util/find-answer-value answers (str (:type menoluokka) ".amount")))})

(defn store-menoluokka-hakemus-rows [avustushaku-id hakemus-id answers]
  (with-tx (fn [tx]
    (let [menoluokka-types (query tx "SELECT id, type FROM virkailija.menoluokka WHERE avustushaku_id = ?" [avustushaku-id])
          menoluokka-rows (map (partial answer->menoluokka-row answers hakemus-id) menoluokka-types)]
      (doseq [menoluokka menoluokka-rows]
        (execute! tx
          "INSERT INTO virkailija.menoluokka_hakemus (menoluokka_id, hakemus_id, amount)
           VALUES (?, ?, ?)
           ON CONFLICT (hakemus_id, menoluokka_id) DO UPDATE SET
             amount = EXCLUDED.amount"
          [(:menoluokka_id menoluokka) (:hakemus_id menoluokka) (:amount menoluokka)]))))))

(defn store-normalized-hakemus [id hakemus answers]
  (log/info (str "Storing normalized fields for hakemus: " id))
  (with-tx (fn [tx]
    (execute! tx
      "INSERT INTO virkailija.normalized_hakemus (hakemus_id, project_name, contact_person, contact_email, contact_phone, organization_name, register_number)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (hakemus_id) DO UPDATE SET
          project_name = EXCLUDED.project_name,
          contact_person = EXCLUDED.contact_person,
          contact_email = EXCLUDED.contact_email,
          contact_phone = EXCLUDED.contact_phone,
          organization_name = EXCLUDED.organization_name,
          register_number = EXCLUDED.register_number"
        [ id,
          (form-util/find-answer-value answers "project-name"),
          (form-util/find-answer-value answers "applicant-name"),
          (form-util/find-answer-value answers "primary-email"),
          (form-util/find-answer-value answers "textField-0"),
          (:organization_name hakemus),
          (:register_number hakemus) ])))
  (log/info (str "Succesfully stored normalized fields for hakemus with id: " id)))

(defn change-normalized-hakemus-contact-person-details [tx user-key, contact-person-details]
  (log/info (str "Change normalized contact person details with user-key: " user-key))
  (let [ contact-person (:name contact-person-details)
         contact-phone (:phone contact-person-details)
         contact-email (:email contact-person-details)]
    (execute! tx
     "UPDATE virkailija.normalized_hakemus SET
      contact_person = ?, contact_email = ?, contact_phone = ? WHERE hakemus_id = (SELECT id FROM hakija.hakemukset WHERE user_key = ? LIMIT 1)"
      [contact-person, contact-email, contact-phone, user-key]
     ))
    (log/info (str "Succesfully changed contact person details with user-key: " user-key)))

(defn on-muutoshakemus [user-key, muutoshakemus]
  (with-tx (fn [tx]
    (when (contains? muutoshakemus :jatkoaika)
          (add-muutoshakemus tx user-key (get muutoshakemus :jatkoaika)))
    (when (contains? muutoshakemus :yhteyshenkilo)
      (log/info (str "Change normalized contact person details with user-key: " user-key))
      (change-normalized-hakemus-contact-person-details tx user-key (get muutoshakemus :yhteyshenkilo))
      (log/info (str "Succesfully changed contact person details with user-key: " user-key))))))

(defn update-hakemus-parent-id [hakemus-id parent-id]
  (exec queries/update-hakemus-parent-id! {:id hakemus-id :parent_id parent-id}))

(defn update-submission [avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals]
  (let [register-number (or register-number
                            (generate-register-number avustushaku-id hakemus-id))
        params (-> {:avustushaku_id avustushaku-id
                    :user_key hakemus-id
                    :user_oid nil
                    :user_first_name nil
                    :user_last_name nil
                    :user_email nil
                    :register_number register-number
                    :form_submission_id submission-id
                    :form_submission_version submission-version}
                   (merge (convert-budget-totals budget-totals))
                   (merge-calculated-params avustushaku-id answers))]
    (exec-all [queries/lock-hakemus params
                   queries/close-existing-hakemus! params
                   queries/update-hakemus-submission<! params])))

(defn- update-status [avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals status status-change-comment]
  (let [params (-> {:avustushaku_id avustushaku-id
                    :user_key hakemus-id
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
                   (merge-calculated-params avustushaku-id answers))]
    (exec-all [queries/lock-hakemus params
                   queries/close-existing-hakemus! params
                   queries/update-hakemus-status<! params])))

(defn open-hakemus-applicant-edit [avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals]
   (update-status avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals :applicant_edit nil))

(defn set-submitted-version [user-key form-submission-id]
  (let [params {:user_key user-key
                :form_submission_id form-submission-id}]
    (exec-all [queries/lock-hakemus params
                        queries/close-existing-hakemus! params
                        queries/set-application-submitted-version<! params])))

(defn verify-hakemus [avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals]
  (update-status avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals :draft nil))

(defn submit-hakemus [avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals]
  (update-status avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals :submitted nil)
  (set-submitted-version hakemus-id submission-id))

(defn cancel-hakemus [avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals comment]
  (update-status avustushaku-id hakemus-id submission-id submission-version register-number answers budget-totals :cancelled comment))

(defn refuse-application [application comment]
  (let [params (assoc application :refused true :refused_comment comment)]
    (exec-all [queries/lock-hakemus params
                        queries/close-existing-hakemus! params
                        queries/set-refused params])))

(defn update-loppuselvitys-status [hakemus-id status]
  (exec queries/update-loppuselvitys-status<! {:id hakemus-id :status status}))

(defn update-valiselvitys-status [hakemus-id status]
  (exec queries/update-valiselvitys-status<! {:id hakemus-id :status status}))

(defn attachment-exists? [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec queries/attachment-exists?)
       first))

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
  (let [blob (slurp-binary-file! file)
        params (-> {:hakemus_id hakemus-id
                    :hakemus_version hakemus-version
                    :field_id field-id
                    :filename filename
                    :content_type content-type
                    :file_size size
                    :file_data blob})]
    (if (attachment-exists? hakemus-id field-id)
      (exec-all [queries/close-existing-attachment! params
                     queries/update-attachment<! params])
      (exec queries/create-attachment<! params))))

(defn close-existing-attachment! [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec queries/close-existing-attachment!)))

(defn list-attachments [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec queries/list-attachments)))

(defn get-attachments [external-hakemus-id hakemus-id]
  (->> (list-attachments hakemus-id)
       (map (partial convert-attachment external-hakemus-id))
       (map (fn [attachment] [(:field-id attachment) attachment]))
       (into {})))

(defn download-attachment [hakemus-id field-id]
  (let [result (->> {:hakemus_id hakemus-id
                     :field_id field-id}
                    (exec queries/download-attachment)
                    first)]
    {:data (io/input-stream (:file_data result))
     :content-type (:content_type result)
     :filename (:filename result)
     :size (:file_size result)}))

(defn valid-token? [token application-id]
  (and
    (some? token)
    (not
      (empty?
        (exec queries/get-application-token
              {:token token :application_id application-id})))))

(defn valid-user-key-token? [token user-key]
  (let [application (get-hakemus user-key)]
    (and
      (some? application)
      (valid-token? token (:id application)))))

(defn revoke-token [token]
  (exec queries/revoke-application-token!
        {:token token}))
