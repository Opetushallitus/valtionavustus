(ns oph.va.db
  (:use [oph.common.db]
        [oph.form.db :as form-db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.db.queries :as queries]))


(defn health-check []
  (->> {}
       (exec queries/health-check)
       first
       :?column?
       (= 1)))

(defn create-hakemus! [form-id answers]
  (let [submission (form-db/create-submission! form-id answers)]
    (let [hakemus (exec queries/create-hakemus<! {:user_key (generate-hash-id)
                                                  :form_submission (:id submission)})]
      {:hakemus hakemus :submission submission})))

(defn get-hakemus [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec queries/get-hakemus-by-user-id)
       first))

(defn update-submission [hakemus-id submission-id submission-version]
  (let [params {:user_key hakemus-id :form_submission_id submission-id :form_submission_version submission-version}]
    (exec-all [queries/lock-hakemus params
               queries/close-existing-hakemus! params
               queries/update-hakemus-submission<! params])))

(defn- update-status [hakemus-id submission-id submission-version status]
  (let [params {:user_key hakemus-id :form_submission_id submission-id :form_submission_version submission-version :status status}]
    (exec-all [queries/lock-hakemus params
               queries/close-existing-hakemus! params
               queries/update-hakemus-status<! params])))

(defn verify-hakemus [hakemus-id submission-id submission-version]
  (update-status hakemus-id submission-id submission-version :draft))

(defn submit-hakemus [hakemus-id submission-id submission-version]
  (update-status hakemus-id submission-id submission-version :submitted))

(defn cancel-hakemus [hakemus-id submission-id submission-version]
  (update-status hakemus-id submission-id submission-version :cancelled))

(defn get-avustushaku [id]
  (->> (exec queries/get-avustushaku {:id id})
       first))
