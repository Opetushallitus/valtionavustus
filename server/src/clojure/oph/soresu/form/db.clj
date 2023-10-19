(ns oph.soresu.form.db
  (:use [oph.soresu.common.db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.form.db.queries :as queries]))

(defn list-forms []
  (->> {}
       (exec queries/list-forms)))

(defn get-form [id]
  (->> (exec queries/get-form {:id id})
       first))

(defn update-form! [tx form]
  ;; NOTE: looks like yesql unwraps sequence parameters, thats why we wrap them one extra time here
    (let [id (:id form)
          content (:content form)
          rules (:rules form)]
      (execute! tx "INSERT INTO archived_forms (form_id, created_at, content, rules)
    SELECT id, created_at, content, rules FROM forms WHERE id = ?" [id])
      (execute! tx "UPDATE forms SET content = ?, rules = ? WHERE id = ?" [content rules id])))

(defn submission-exists? [form-id submission-id]
  (->> {:form_id form-id :submission_id submission-id}
       (exec queries/submission-exists?)
       empty?
       not))

(defn update-submission! [form-id submission-id answers]
  (let [params {:form_id form-id :submission_id submission-id :answers answers}]
    (exec-all [queries/lock-submission params
                   queries/close-existing-submission! params
                   queries/update-submission<! params])))

(defn create-submission! [form-id answers]
  (->> {:form_id form-id :answers answers}
       (exec queries/create-submission<!)))

(defn get-form-submission [form-id submission-id]
  (->> {:form_id form-id :submission_id submission-id}
       (exec queries/get-form-submission)
       first))

(defn get-form-submission-version [form-id submission-id version]
  (first
    (exec queries/get-form-submission-version
          {:form_id form-id :submission_id submission-id :version version})))

(defn get-form-submission-versions [form-id submission-id]
  (->> {:form_id form-id :submission_id submission-id}
       (exec queries/get-form-submission-versions)))
