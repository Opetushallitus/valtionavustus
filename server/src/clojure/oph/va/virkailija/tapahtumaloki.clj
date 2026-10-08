(ns oph.va.virkailija.tapahtumaloki
  (:require
   [oph.soresu.common.db :as db]
   [clojure.tools.logging :as log]))

(def loppuselvitys-palautettu-tyyppi "loppuselvitys-palautettu-asiatarkastukseen")

(defn- store-log-entry [tx {:keys [tyyppi avustushaku_id hakemus_id batch_id emails success user_name user_oid email_id]}]
  (db/query tx "INSERT INTO virkailija.tapahtumaloki
             (id, tyyppi, avustushaku_id, hakemus_id, batch_id, emails, success, user_name, user_oid, email_id)
             VALUES (NEXTVAL ('virkailija.tapahtumaloki_id_seq'), ?, ?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id"
            [tyyppi avustushaku_id hakemus_id batch_id emails success user_name user_oid email_id]))

(defn create-log-entry-tx [tx tyyppi avustushaku-id hakemus-id identity batch-id emails email-id success]
  (let [user-info {:user_oid (:person-oid identity)
                   :user_name (format " %s %s " (:first-name identity) (:surname identity))}]
    (log/info (str "Creating log entry " tyyppi " for avustushaku " avustushaku-id " hakemus " hakemus-id))
    (store-log-entry
     tx
     (merge user-info
            {:tyyppi         tyyppi
             :avustushaku_id avustushaku-id
             :hakemus_id     hakemus-id
             :batch_id       batch-id
             :emails         {:addresses emails}
             :email_id       email-id
             :success        success}))))

(defn create-log-entry [tyyppi avustushaku-id hakemus-id identity batch-id emails email-id success]
  (db/with-tx
    (fn [tx]
      (create-log-entry-tx tx tyyppi avustushaku-id hakemus-id identity batch-id emails email-id success))))

(defn create-paatoksen-lahetys-entry [avustushaku-id hakemus-id identity batch-id emails success]
  (create-log-entry "paatoksen_lahetys" avustushaku-id hakemus-id identity batch-id emails nil success))

(defn create-loppuselvitys-palautettu-entry-tx [tx avustushaku-id hakemus-id identity]
  ;; batch_id is NOT NULL in tapahtumaloki
  (create-log-entry-tx tx loppuselvitys-palautettu-tyyppi avustushaku-id hakemus-id identity "" nil nil true))

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

(defn- palautus->json [palautus]
  (-> palautus
      (dissoc :avustus_kaytetty_paatoksen_mukaisesti :omarahoitus_kaytetty :taloustiedot_kirjattu :avustus_alle_100k)
      (assoc :asiatarkastus-checklist
             (when (some? (:avustus_kaytetty_paatoksen_mukaisesti palautus))
               {:avustus-kaytetty-paatoksen-mukaisesti (:avustus_kaytetty_paatoksen_mukaisesti palautus)
                :omarahoitus-kaytetty (:omarahoitus_kaytetty palautus)
                :taloustiedot-kirjattu (:taloustiedot_kirjattu palautus)
                :avustus-alle-100k (:avustus_alle_100k palautus)}))))

(defn get-loppuselvitys-palautukset [avustushaku-id hakemus-id]
  (map palautus->json
       (db/query-original-identifiers
        "SELECT t.id, t.created_at, t.user_name,
            p.information_verified_by, p.information_verified_at, p.information_verification, p.syy,
            p.avustus_kaytetty_paatoksen_mukaisesti, p.omarahoitus_kaytetty, p.taloustiedot_kirjattu, p.avustus_alle_100k,
            p.riskiperusteinen
          FROM virkailija.tapahtumaloki t
          JOIN virkailija.palautettu_asiatarkastus p ON p.tapahtumaloki_id = t.id
          WHERE t.avustushaku_id = ? AND t.hakemus_id = ? AND t.tyyppi = ?
          ORDER BY t.created_at ASC"
        [avustushaku-id hakemus-id loppuselvitys-palautettu-tyyppi])))
