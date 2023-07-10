(ns oph.va.virkailija.tapahtumaloki
    (:require
      [oph.soresu.common.db :as db]
      [clojure.tools.logging :as log]))

(defn- store-log-entry [{:keys [tyyppi avustushaku_id hakemus_id batch_id emails success user_name user_oid]}]
  (db/query "INSERT INTO virkailija.tapahtumaloki
             (id, tyyppi, avustushaku_id, hakemus_id, batch_id, emails, success, user_name, user_oid)
             VALUES (NEXTVAL ('virkailija.tapahtumaloki_id_seq'), ?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id"
            [tyyppi avustushaku_id hakemus_id batch_id emails success user_name user_oid]))

(defn create-log-entry [tyyppi avustushaku-id hakemus-id identity batch-id emails success]
  (let [user-info {:user_oid (:person-oid identity)
                   :user_name (format " %s %s " (:first-name identity) (:surname identity))}]
    (log/info (str "Creating log entry " tyyppi " for " avustushaku-id))
    (store-log-entry
      (merge user-info
             {:tyyppi         tyyppi
              :avustushaku_id avustushaku-id
              :hakemus_id     hakemus-id
              :batch_id       batch-id
              :emails         {:addresses emails}
              :success        success}))))

(defn create-paatoksen-lahetys-entry [avustushaku-id hakemus-id identity batch-id emails success]
      (create-log-entry "paatoksen_lahetys" avustushaku-id hakemus-id identity batch-id emails success))

(defn get-tapahtumaloki-entries [tyyppi avustushaku-id]
  (db/query-original-identifiers
    "SELECT id, tyyppi, created_at, avustushaku_id, hakemus_id, batch_id, emails, success, user_name, user_oid
     FROM virkailija.tapahtumaloki
     WHERE avustushaku_id = ? AND tyyppi = ?"
    [avustushaku-id tyyppi]))
