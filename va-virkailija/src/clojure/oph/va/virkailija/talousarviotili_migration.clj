(ns oph.va.virkailija.talousarviotili_migration
  (:require [oph.soresu.common.db :refer [query with-tx execute!]]
            [clojure.tools.logging :as log]))

(defn- get-avustushaut-which-have-a-rahoitusalue [tx]
  (query tx "SELECT id, content -> 'rahoitusalueet'
    AS rahoitusalueet
    FROM hakija.avustushaut
    WHERE content -> 'rahoitusalueet' IS NOT null
     AND jsonb_array_length(content -> 'rahoitusalueet') > 0
     ORDER BY id" []))

(defn- haku-tili-mapping-exists [tx, avustushakuId, ta-tili-id]
   (let [result (query tx "SELECT EXISTS(SELECT 1 FROM avustushaku_talousarviotilit
          WHERE avustushaku_id = ? AND talousarviotili_id = ?)", [avustushakuId, ta-tili-id])]

    (:exists (first result))))

(defn- append-koulutusaste-for-avustushaku-talousarviotili-mapping [tx, avustushakuId, ta-tili-id, koulutusaste]
  (log/infof "Appending koulutusaste \"%s\" for avustushaku \"%s\" and tili \"%s\"" koulutusaste avustushakuId ta-tili-id)
  (execute! tx
      "UPDATE avustushaku_talousarviotilit
        SET koulutusasteet = koulutusasteet || jsonb_build_array(?)
      WHERE
        avustushaku_id = ? AND talousarviotili_id = ?
      AND NOT
        koulutusasteet::jsonb @> to_jsonb(?)"
      [koulutusaste, avustushakuId, ta-tili-id, koulutusaste]))

(defn- insert-mapping-for-avustushaku-talousarviotili [tx, avustushakuId, ta-tili-id, koulutusaste]
  (log/infof "Creating mapping for avustushaku \"%s\" and tili \"%s\"" avustushakuId ta-tili-id)
  (execute! tx
      "INSERT INTO avustushaku_talousarviotilit
        (avustushaku_id, talousarviotili_id, koulutusasteet)
      VALUES
        (?, ?, json_build_array(?)::jsonb)"
      [avustushakuId, ta-tili-id, koulutusaste]))

(defn- insert-or-update-avustushaku-talousarviotili-mapping [tx avustushakuId, ta-tili-id koulutusaste]
  (if (haku-tili-mapping-exists tx avustushakuId ta-tili-id)
    (append-koulutusaste-for-avustushaku-talousarviotili-mapping tx avustushakuId ta-tili-id koulutusaste)
    (insert-mapping-for-avustushaku-talousarviotili tx avustushakuId ta-tili-id koulutusaste)
    ))

(defn- insert-talousarviotili-if-not-exists [tx code]
  (log/infof "Creating new talousarviotili for code \"%s\"" code)
  (let [result (query tx
      "WITH e AS(
        INSERT INTO talousarviotilit
          (code, migrated_from_not_normalized_ta_tili)
        VALUES
          (?, true)
        ON CONFLICT
          (code) WHERE migrated_from_not_normalized_ta_tili
          DO NOTHING
        RETURNING id
      )
      SELECT * FROM e
      UNION
        SELECT id FROM talousarviotilit
        WHERE code=?;"
      [code, code])

      ta-tili-id (:id (first result))]
      ta-tili-id))

(defn- normalize-talousarviotili [tx, code, name, avustushakuId]
  (let [ta-tili-id (insert-talousarviotili-if-not-exists tx code)]
    (insert-or-update-avustushaku-talousarviotili-mapping tx avustushakuId ta-tili-id name)))

(defn- normalize-tilit-for-avustushaku [tx avustushakuId, rahoitusalueName, talousarviotilit]
  (doseq [tili talousarviotilit]
      (normalize-talousarviotili
        tx (clojure.string/trim tili) rahoitusalueName avustushakuId)))

(defn- normalize-rahoitusalueet-for-avustushaku [tx haku]
  (doseq [r (:rahoitusalueet haku)]
    (let [id (:id haku)
          rahoitusalue (:rahoitusalue r)
          talousarviotilit (:talousarviotilit r)
          ]
      (normalize-tilit-for-avustushaku tx id rahoitusalue talousarviotilit))))

(defn disable-ta-tili-modified-check [tx] (execute! tx "ALTER TABLE virkailija.avustushaku_talousarviotilit DISABLE TRIGGER ta_tili_cannot_be_modified_if_avustushaku_has_been_published" []))
(defn enable-ta-tili-modified-check [tx] (execute! tx "ALTER TABLE virkailija.avustushaku_talousarviotilit ENABLE TRIGGER ta_tili_cannot_be_modified_if_avustushaku_has_been_published" []))

(defn migrate-non-normalized-ta-tili-to-normalized! []
  (log/info "Migrating from non-normalized TA-tili to normalized TA-tili")
  (with-tx (fn [tx]
    (let [avustushaut (get-avustushaut-which-have-a-rahoitusalue tx)]
      (disable-ta-tili-modified-check tx)
      (doseq [haku avustushaut]
        (normalize-rahoitusalueet-for-avustushaku tx haku)
      (enable-ta-tili-modified-check tx)
   )))))

(defn- has-migration-been-completed-successfully []
  (let [result (query "SELECT EXISTS(SELECT 1 FROM talousarviotilit
          WHERE migrated_from_not_normalized_ta_tili IS true)", [])]
    (:exists (first result))))

(defn- should-run-migration [config] true)

(defn run-ta-tili-normalization-migration-if-needed [config]
  (when (and (should-run-migration config) (not (has-migration-been-completed-successfully)))
    (migrate-non-normalized-ta-tili-to-normalized!)
  ))
