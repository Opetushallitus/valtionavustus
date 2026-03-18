(ns oph.soresu.form.db
  (:use [oph.soresu.common.db]
        [clojure.tools.trace :only [trace]])
  (:require [ring.util.http-response :as http]))

(defn list-forms []
  (query-original-identifiers "select * from forms" []))

(defn get-form [id]
  (first (query-original-identifiers "select * from forms where id = ?" [id])))

(defn get-form-tx [tx id]
  (first (query-original-identifiers tx "SELECT * FROM forms WHERE id = ?" [id])))

(defn update-form! [tx form]
  (let [id (:id form)
        content (:content form)
        rules (:rules form)]
    (execute! tx "INSERT INTO archived_forms (form_id, created_at, content, rules)
    SELECT id, created_at, content, rules FROM forms WHERE id = ?" [id])
    (execute! tx "UPDATE forms SET content = ?, rules = ? WHERE id = ?" [content rules id])))

(defn submission-exists? [form-id submission-id]
  (not (empty? (query-original-identifiers
                "SELECT 1 from form_submissions where id = ? and form = ? and version_closed IS NULL"
                [submission-id form-id]))))

(defn submission-exists-tx? [tx form-id submission-id]
  (not (empty? (query-original-identifiers tx
                                           "SELECT 1 from form_submissions where id = ? and form = ? and version_closed IS NULL"
                                           [submission-id form-id]))))

(defn update-submission! [form-id submission-id answers]
  (with-tx (fn [tx]
             (query-original-identifiers tx
                                         "SELECT 1 FROM form_submissions WHERE id = ? AND form = ? FOR UPDATE NOWAIT"
                                         [submission-id form-id])
             (execute! tx
                       "UPDATE form_submissions SET version_closed = now() WHERE form = ? AND id = ? AND version_closed IS NULL"
                       [form-id submission-id])
             (first (query-original-identifiers tx
                                                "INSERT INTO form_submissions (id, version, form, answers)
       SELECT ?, max(version) + 1, ?, ? FROM form_submissions WHERE id = ? AND form = ?
       RETURNING *"
                                                [submission-id form-id answers submission-id form-id])))))

(defn update-submission-tx! [tx form-id submission-id answers]
  (let [close-count (first (execute! tx
                                     "UPDATE form_submissions SET version_closed = now() WHERE form = ? AND id = ? AND version_closed IS NULL"
                                     [form-id submission-id]))]
    (if (zero? close-count)
      (http/not-found!)
      (if-let [submission (first (query-original-identifiers tx
                                                             "INSERT INTO form_submissions (id, version, form, answers)
                                   SELECT ?, max(version) + 1, ?, ? FROM form_submissions WHERE id = ? AND form = ?
                                   RETURNING *"
                                                             [submission-id form-id answers submission-id form-id]))]
        (http/ok submission)
        (http/internal-server-error)))))

(defn create-submission! [form-id answers]
  (first (query-original-identifiers
          "INSERT INTO form_submissions (id, version, form, answers)
            VALUES (nextval('form_submissions_id_seq'), 0, ?, ?)
            RETURNING *"
          [form-id answers])))

(defn get-form-submission [form-id submission-id]
  (first (query-original-identifiers
          "SELECT * FROM form_submissions WHERE id = ? AND form = ? AND version_closed IS NULL"
          [submission-id form-id])))

(defn get-form-submission-version [form-id submission-id version]
  (first (query-original-identifiers
          "SELECT * FROM form_submissions WHERE id = ? AND form = ? AND version = ? LIMIT 1"
          [submission-id form-id version])))

(defn get-form-submission-versions [form-id submission-id]
  (query-original-identifiers
   "SELECT * FROM form_submissions WHERE id = ? AND form = ? ORDER BY version DESC"
   [submission-id form-id]))
