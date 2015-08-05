(ns oph.form.db
  (:use [oph.common.db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.form.db.queries :as queries]))

(defn list-forms []
  (->> {}
       (exec queries/list-forms)))

(defn get-form [id]
  (->> (exec queries/get-form {:id id})
       first))

(defn submission-exists? [form-id submission-id]
  (->> {:form_id form-id :submission_id submission-id}
       (exec queries/submission-exists?)
       empty?
       not))

(defn update-submission! [form-id submission-id answers]
  (let [params {:form_id form-id :submission_id submission-id}]
    (exec-all [queries/lock-submission params
               queries/close-existing-submission! params]))
  (->> {:form_id form-id :submission_id submission-id :answers answers}
       (exec queries/update-submission<!)))

(defn create-submission! [form-id answers]
  (->> {:form_id form-id :answers answers}
       (exec queries/create-submission<!)))

(defn get-form-submission [form-id submission-id]
  (->> {:form_id form-id :submission_id submission-id}
       (exec queries/get-form-submission)
       first))

(defn get-form-submission-versions [form-id submission-id]
  (->> {:form_id form-id :submission_id submission-id}
       (exec queries/get-form-submission-versions)))
