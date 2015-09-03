(ns oph.va.hakija.db
  (:use [oph.common.db]
        [oph.form.db :as form-db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.hakija.db.queries :as queries]
            [oph.va.budget :as va-budget]))


(defn health-check []
  (->> {}
       (exec :db queries/health-check)
       first
       :?column?
       (= 1)))

(defn get-avustushaku [id]
  (->> (exec :db queries/get-avustushaku {:id id})
       first))

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

(defn- calculate-budget-summary [avustushaku-id answers]
  (let [avustushaku (get-avustushaku avustushaku-id)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)]
    (va-budget/calculate-totals answers avustushaku form)))

(defn- get-budget-params [avustushaku-id answers]
  (let [budget-summary (calculate-budget-summary avustushaku-id answers)]
    {:budget_total (:total-needed budget-summary)
     :budget_oph_share (:oph-share budget-summary)}))

(defn- merge-calculated-params [params avustushaku-id answers]
  (merge params
         (get-budget-params avustushaku-id answers)))

(defn update-submission [avustushaku-id hakemus-id submission-id submission-version answers]
  (let [params (-> {:avustushaku_id avustushaku-id
                    :user_key hakemus-id
                    :form_submission_id submission-id
                    :form_submission_version submission-version}
                   (merge-calculated-params avustushaku-id answers)) ]
    (exec-all :db [queries/lock-hakemus params
                   queries/close-existing-hakemus! params
                   queries/update-hakemus-submission<! params])))

(defn- update-status [avustushaku-id hakemus-id submission-id submission-version answers status]
  (let [params (-> {:avustushaku_id avustushaku-id
                    :user_key hakemus-id
                    :form_submission_id submission-id
                    :form_submission_version submission-version
                    :status status}
                   (merge-calculated-params avustushaku-id answers))]
    (exec-all :db [queries/lock-hakemus params
                   queries/close-existing-hakemus! params
                   queries/update-hakemus-status<! params])))

(defn verify-hakemus [avustushaku-id hakemus-id submission-id submission-version answers]
  (update-status avustushaku-id hakemus-id submission-id submission-version answers :draft))

(defn submit-hakemus [avustushaku-id hakemus-id submission-id submission-version answers]
  (update-status avustushaku-id hakemus-id submission-id submission-version answers :submitted))

(defn cancel-hakemus [avustushaku-id hakemus-id submission-id submission-version answers]
  (update-status avustushaku-id hakemus-id submission-id submission-version answers :cancelled))
