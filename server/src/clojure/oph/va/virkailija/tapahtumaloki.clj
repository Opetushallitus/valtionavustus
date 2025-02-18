(ns oph.va.virkailija.tapahtumaloki
  (:require
   [oph.soresu.common.db :as db]
   [clojure.tools.logging :as log]))

(defn- store-log-entry [{:keys [tyyppi avustushaku_id hakemus_id batch_id emails success user_name user_oid email_id]}]
  (db/query "INSERT INTO virkailija.tapahtumaloki
             (id, tyyppi, avustushaku_id, hakemus_id, batch_id, emails, success, user_name, user_oid, email_id)
             VALUES (NEXTVAL ('virkailija.tapahtumaloki_id_seq'), ?, ?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id"
            [tyyppi avustushaku_id hakemus_id batch_id emails success user_name user_oid email_id]))

(defn create-log-entry [tyyppi avustushaku-id hakemus-id identity batch-id emails email-id success]
  (let [user-info {:user_oid (:person-oid identity)
                   :user_name (format " %s %s " (:first-name identity) (:surname identity))}]
    (log/info (str "Creating log entry " tyyppi " for avustushaku " avustushaku-id " hakemus " hakemus-id))
    (store-log-entry
     (merge user-info
            {:tyyppi         tyyppi
             :avustushaku_id avustushaku-id
             :hakemus_id     hakemus-id
             :batch_id       batch-id
             :emails         {:addresses emails}
             :email_id       email-id
             :success        success}))))

(defn create-paatoksen-lahetys-entry [avustushaku-id hakemus-id identity batch-id emails success]
  (create-log-entry "paatoksen_lahetys" avustushaku-id hakemus-id identity batch-id emails nil success))

(defn get-tapahtumaloki-entries [tyyppi avustushaku-id]
  (db/query-original-identifiers
   "SELECT id, tyyppi, created_at, avustushaku_id, hakemus_id, batch_id, emails, success, user_name, user_oid, email_id
     FROM virkailija.tapahtumaloki
     WHERE avustushaku_id = ? AND tyyppi = ?"
   [avustushaku-id tyyppi]))

(defn get-hakemus-tapahtumaloki-entries [tyyppi avustushaku-id hakemus-id]
  (db/query-original-identifiers
   "SELECT id, tyyppi, created_at, avustushaku_id, hakemus_id, batch_id, emails, success, user_name, user_oid, email_id,
       (SELECT json_build_object(
           'id', id,
           'formatted', formatted,
           'from_address', from_address,
           'reply_to', reply_to,
           'sender', sender,
           'to_address', to_address,
           'created_at', created_at,
           'subject', subject
           ) FROM virkailija.email where tapahtumaloki.email_id = id)::jsonb as email_content
     FROM virkailija.tapahtumaloki
     WHERE avustushaku_id = ? AND tyyppi = ? AND hakemus_id = ?
     ORDER BY created_at ASC"
   [avustushaku-id tyyppi hakemus-id]))
