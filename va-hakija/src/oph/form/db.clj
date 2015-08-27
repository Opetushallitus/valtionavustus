(ns oph.form.db
  (:use [oph.common.db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.form.db.queries :as queries]))

(defn list-forms []
  (->> {}
       (exec :db queries/list-forms)))

(defn get-form [id]
  (->> (exec :db queries/get-form {:id id})
       first))

(defn submission-exists? [form-id submission-id]
  (->> {:form_id form-id :submission_id submission-id}
       (exec :db queries/submission-exists?)
       empty?
       not))

(defn update-submission! [form-id submission-id answers]
  (let [params {:form_id form-id :submission_id submission-id :answers answers}]
    (exec-all :db [queries/lock-submission params
                   queries/close-existing-submission! params
                   queries/update-submission<! params])))

(defn create-submission! [form-id answers]
  (->> {:form_id form-id :answers answers}
       (exec :db queries/create-submission<!)))

(defn get-form-submission [form-id submission-id]
  (->> {:form_id form-id :submission_id submission-id}
       (exec :db queries/get-form-submission)
       first))

(defn get-form-submission-versions [form-id submission-id]
  (->> {:form_id form-id :submission_id submission-id}
       (exec :db queries/get-form-submission-versions)))
