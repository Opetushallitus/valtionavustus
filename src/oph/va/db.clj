(ns oph.va.db
  (:use [oph.common.db]
        [oph.form.db :as form-db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.db.queries :as queries]))


(defn create-hakemus! [form-id answers]
  (let [submission (form-db/create-submission! form-id answers)]
    (let [hakemus (exec queries/create-hakemus<! {:user_key (generate-hash-id) :verify_key (generate-hash-id) :form_submission (:id submission)})]
      {:hakemus hakemus :submission submission})))

(defn get-hakemus [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec queries/get-hakemus)
       first))

(defn submit-hakemus [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec queries/submit-hakemus<!)))

(defn verify-hakemus [hakemus-id verification]
  (->> {:user_key hakemus-id :verify_key verification}
       (exec queries/verify-hakemus<!)))

(defn get-avustushaku [id]
  (->> (exec queries/get-avustushaku {:id id})
       first))
