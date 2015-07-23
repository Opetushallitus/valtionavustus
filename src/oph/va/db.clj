(ns oph.va.db
  (:use [oph.common.db]
        [oph.form.db :as form-db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.db.queries :as queries]))


(defn create-hakemus! [form-id answers]
  (let [submission (form-db/create-submission! form-id answers)
        user-key (generate-hash-id)
        email-key (generate-hash-id)]
    (exec queries/create-hakemus<! {:user_key user-key :email_key email-key :form_submission (:id submission)})
    {:id user-key :email-key email-key}))

(defn get-hakemus [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec queries/get-hakemus)
       first))

(defn submit-hakemus [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec queries/submit-hakemus<!)
       first))

(defn get-avustushaku [id]
  (->> (exec queries/get-avustushaku {:id id})
       first))
