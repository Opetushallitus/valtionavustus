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

(defn update-form! [form]
  ;; NOTE: looks like yesql unwraps sequence parameters, thats way we wrap them one extra time here
  (let [params {:id (:id form) :content (list (:content form)) :rules (list (:rules form))}]
    (exec-all :db [queries/archive-form! params
                   queries/update-form! params])))

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
