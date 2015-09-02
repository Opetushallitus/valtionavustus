(ns oph.va.hakija.db
  (:use [oph.common.db]
        [oph.form.db :as form-db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.hakija.db.queries :as queries]))


(defn health-check []
  (->> {}
       (exec :db queries/health-check)
       first
       :?column?
       (= 1)))

(defn create-hakemus! [avustushaku-id form-id answers]
  (let [submission (form-db/create-submission! form-id answers)]
    (let [hakemus (exec :db queries/create-hakemus<! {:avustushaku_id avustushaku-id
                                                      :user_key (generate-hash-id)
                                                      :form_submission (:id submission)})]
      {:hakemus hakemus :submission submission})))

(defn get-hakemus [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec :db queries/get-hakemus-by-user-id)
       first))

(defn update-submission [avustushaku-id hakemus-id submission-id submission-version budget-total budget-oph-share]
  (let [params {:avustushaku_id avustushaku-id
                :user_key hakemus-id
                :form_submission_id submission-id
                :form_submission_version submission-version
                :budget_total budget-total
                :budget_oph_share budget-oph-share}]
    (exec-all :db [queries/lock-hakemus params
                   queries/close-existing-hakemus! params
                   queries/update-hakemus-submission<! params])))

(defn- update-status [avustushaku-id hakemus-id submission-id submission-version status]
  (let [params {:avustushaku_id avustushaku-id
                :user_key hakemus-id
                :form_submission_id submission-id
                :form_submission_version submission-version
                :status status}]
    (exec-all :db [queries/lock-hakemus params
                   queries/close-existing-hakemus! params
                   queries/update-hakemus-status<! params])))

(defn verify-hakemus [avustushaku-id hakemus-id submission-id submission-version]
  (update-status avustushaku-id hakemus-id submission-id submission-version :draft))

(defn submit-hakemus [avustushaku-id hakemus-id submission-id submission-version]
  (update-status avustushaku-id hakemus-id submission-id submission-version :submitted))

(defn cancel-hakemus [avustushaku-id hakemus-id submission-id submission-version]
  (update-status avustushaku-id hakemus-id submission-id submission-version :cancelled))

(defn get-avustushaku [id]
  (->> (exec :db queries/get-avustushaku {:id id})
       first))
