(ns oph.va.hakija.db
  (:use [oph.common.db]
        [oph.form.db :as form-db]
        [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [oph.va.hakija.db.queries :as queries]
            [oph.va.budget :as va-budget]
            [oph.form.formutil :as form-util]))

(defn slurp-binary-file! [file]
  (io! (with-open [reader (io/input-stream file)]
         (let [buffer (byte-array (.length file))]
           (.read reader buffer)
           buffer))))

(defn health-check []
  (->> {}
       (exec :db queries/health-check)
       first
       :?column?
       (= 1)))

(defn get-avustushaku [id]
  (->> (exec :db queries/get-avustushaku {:id id})
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

(defn- pluck-key [answers key as default]
  (let [value (or (form-util/find-answer-value answers key) default)]
    {as value}))

(defn- get-organization-name [answers] (pluck-key answers "organization" :organization_name ""))
(defn- get-project-name [answers] (pluck-key answers "project-name" :project_name ""))

(defn- merge-calculated-params [params avustushaku-id answers]
  (merge params
         (get-budget-params avustushaku-id answers)
         (get-organization-name answers)
         (get-project-name answers)))

(defn create-hakemus! [avustushaku-id form-id answers]
  (let [submission (form-db/create-submission! form-id answers)
        params (-> {:avustushaku_id avustushaku-id
                    :user_key (generate-hash-id)
                    :form_submission (:id submission)}
                   (merge-calculated-params avustushaku-id answers))
        hakemus (exec :db queries/create-hakemus<! params)]
    {:hakemus hakemus :submission submission}))

(defn get-hakemus [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec :db queries/get-hakemus-by-user-id)
       first))

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

(defn attachment-exists? [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec :db queries/attachment-exists?)
       first))

(defn create-attachment [hakemus-id hakemus-version field-id filename content-type size file]
  (let [blob (slurp-binary-file! file)
        params (-> {:hakemus_id hakemus-id
                    :hakemus_version hakemus-version
                    :field_id field-id
                    :filename filename
                    :content_type content-type
                    :file_size size
                    :file_data blob})]
    (if (attachment-exists? hakemus-id field-id)
      (exec-all :db [queries/close-existing-attachment! params
                     queries/update-attachment<! params])
      (exec :db queries/create-attachment<! params))))

(defn close-existing-attachment! [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec :db queries/close-existing-attachment!)))
