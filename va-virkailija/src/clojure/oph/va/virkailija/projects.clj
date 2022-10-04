(ns oph.va.virkailija.projects
  (:require [oph.soresu.common.db :refer [exec query with-tx execute!]]
            [oph.va.virkailija.utils :refer
             [convert-to-dash-keys convert-to-underscore-keys]]))

(defn update-project [hakemus-id project]
  (execute!
              "UPDATE hakija.hakemukset h
               SET project_id = ? 
               WHERE h.id = ?"
              [(:id project) hakemus-id]))

(defn get-project [hakemus-id]
  (first (query "SELECT
            va_code_values.id, value_type, year, code, code_value, hidden
          FROM
            virkailija.va_code_values
          JOIN hakija.hakemukset h
            ON h.id = ?
          WHERE
            va_code_values.id = h.project_id"
         [hakemus-id])))

(defn get-projects [avustushaku-id]
  (query "SELECT
            va_code_values.id, value_type, year, code, code_value, hidden
          FROM
            virkailija.va_code_values
          JOIN
            virkailija.avustushaku_project_code ap
            ON ap.avustushaku_id = ?
          WHERE
            deleted IS NULL AND va_code_values.id = ap.project_id
          ORDER BY va_code_values.id"
         [avustushaku-id]))

(defn insert-project [avustushaku-id project tx]
  (execute! tx
              "INSERT INTO virkailija.avustushaku_project_code (avustushaku_id, project_id)
                VALUES (?, ?)"
              [avustushaku-id (:id project)]))

(defn update-projects [avustushaku-id projects]
  (with-tx (fn [tx]
    (execute! tx
              "DELETE FROM virkailija.avustushaku_project_code
                WHERE avustushaku_id = ?"
              [avustushaku-id])
    (run! (fn [project] (insert-project avustushaku-id project tx)) projects))))
