(ns oph.va.virkailija.avustushaku_talousarviotilit
  (:require [oph.soresu.common.db :refer [exec query with-tx execute!]]))

(defn get-avustushaku-talousarviotilit [avustushaku-id]
  (query "
           SELECT tt.*, koulutusasteet
           FROM avustushaku_talousarviotilit att
           JOIN talousarviotilit tt ON att.talousarviotili_id = tt.id
           WHERE avustushaku_id = ?
        " [avustushaku-id]))

(defn insert-talousarviotili [avustushaku-id talousarviotili, tx]
  (execute! tx "
                INSERT INTO avustushaku_talousarviotilit (avustushaku_id, talousarviotili_id, koulutusasteet)
                VALUES (?, ?, ?)
                ", [avustushaku-id, (:id talousarviotili) (:koulutusasteet talousarviotili)]))

(defn post-avustushaku-talousarviotilit [avustushaku-id talousarviotilit]
  (with-tx (fn [tx]
             (execute! tx
                       "DELETE FROM avustushaku_talousarviotilit
                        WHERE avustushaku_id = ?" [avustushaku-id])
             (run! (fn [talousarviotili] (insert-talousarviotili avustushaku-id talousarviotili tx)) talousarviotilit))))

            