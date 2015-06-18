(ns oph.va.db
  (:use [oph.common.db]
        [oph.form.db :as form-db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.db.queries :as queries]))


(defn create-hakemus! [form-id answers]
  (let [submission (form-db/create-submission! form-id answers)]
    (let [user-key (generate-hash-id)]
      (exec queries/create-hakemus<! {:user_key user-key :form_submission (:id submission) :status :draft})
      {:id user-key})))

(defn get-hakemus [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec queries/get-hakemus)
       first))

(defn submit-hakemus [hakemus-id]
  (->> {:user_key hakemus-id :status :submitted}
       (exec queries/update-hakemus<!)
       first))

(defn get-avustushaku [id]
  (->> (exec queries/get-avustushaku {:id id})
       first))
