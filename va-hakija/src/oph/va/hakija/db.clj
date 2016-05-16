(ns oph.va.hakija.db
  (:use [oph.soresu.common.db]
        [oph.soresu.form.db :as form-db]
        [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [oph.soresu.common.jdbc.extensions :refer :all]
            [oph.soresu.form.formutil :as form-util]
            [oph.va.jdbc.extensions :refer :all]
            [oph.va.hakija.db.queries :as queries]
            [oph.va.budget :as va-budget]))

(defn slurp-binary-file! [file]
  (io! (with-open [reader (io/input-stream file)]
         (let [buffer (byte-array (.length file))]
           (.read reader buffer)
           buffer))))

(defn health-check []
  (->> {}
       (exec :form-db queries/health-check)
       first
       :?column?
       (= 1)))

(defn get-avustushaku [id]
  (->> (exec :form-db queries/get-avustushaku {:id id})
       first))

(defn list-avustushaut []
  (exec :form-db queries/list-avustushaut {}))


(defn add-paatos-view[hakemus-id headers remote-addr]
  (exec :form-db queries/create-paatos-view! {:hakemus_id hakemus-id :headers headers :remote_addr remote-addr}))

(defn update-avustushaku [avustushaku]
  (exec-all :form-db  [queries/archive-avustushaku! avustushaku
                  queries/update-avustushaku! avustushaku]))

(defn- calculate-budget-summary [avustushaku-id answers]
  (let [avustushaku (get-avustushaku avustushaku-id)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)]
    (va-budget/calculate-totals answers avustushaku form)))

(defn- get-budget-params [avustushaku-id answers]
  (let [budget-summary (calculate-budget-summary avustushaku-id answers)]
    {:budget_total (or (:total-needed budget-summary) 0)
     :budget_oph_share (or (:oph-share budget-summary) 0)}))

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

(defn get-hakemus [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec :form-db queries/get-hakemus-by-user-id)
       first))

(defn list-hakemus-change-requests [hakemus-id]
  (->> {:user_key hakemus-id}
       (exec :form-db queries/list-hakemus-change-requests-by-user-id)))

(defn find-hakemus-by-parent-id-and-type [parent-id hakemus-type]
  (->> {:parent_id parent-id :hakemus_type hakemus-type}
       (exec :form-db queries/find-by-parent-id-and-hakemus-type) first))

(defn- register-number-sequence-exists? [register-number]
  (->> (exec :form-db queries/register-number-sequence-exists? {:suffix register-number})
       first
       nil?
       not))

(defn generate-register-number [avustushaku-id user-key]
  (if-let [avustushaku-register-number (-> (get-avustushaku avustushaku-id) :register_number)]
    (when (re-matches #"\d+/\d+" avustushaku-register-number)
      (let [hakemus (get-hakemus user-key)
            params {:suffix avustushaku-register-number}
            {:keys [suffix seq_number]} (if (register-number-sequence-exists? avustushaku-register-number)
                                          (exec :form-db queries/update-register-number-sequence<! params)
                                          (exec :form-db queries/create-register-number-sequence<! params))]
        (format "%d/%s" seq_number avustushaku-register-number)))))

(defn create-hakemus! [avustushaku-id form-id answers hakemus-type]
  (let [submission (form-db/create-submission! form-id answers)
        user-key (generate-hash-id)
        params (-> {:avustushaku_id avustushaku-id
                    :user_key user-key
                    :form_submission (:id submission)
                    :register_number (generate-register-number avustushaku-id user-key)
                    :hakemus_type hakemus-type}
                   (merge-calculated-params avustushaku-id answers))
        hakemus (exec :form-db queries/create-hakemus<! params)]
    {:hakemus hakemus :submission submission}))

(defn update-hakemus-parent-id [hakemus-id parent-id]
  (exec :form-db queries/update-hakemus-parent-id! {:id hakemus-id :parent_id parent-id}))

(defn update-submission [avustushaku-id hakemus-id submission-id submission-version register-number answers]
  (let [register-number (or register-number
                            (generate-register-number avustushaku-id hakemus-id))
        params (-> {:avustushaku_id avustushaku-id
                    :user_key hakemus-id
                    :user_oid nil
                    :user_first_name nil
                    :user_last_name nil
                    :user_email nil
                    :register_number register-number
                    :form_submission_id submission-id
                    :form_submission_version submission-version}
                   (merge-calculated-params avustushaku-id answers))]
    (exec-all :form-db [queries/lock-hakemus params
                   queries/close-existing-hakemus! params
                   queries/update-hakemus-submission<! params])))

(defn- update-status [avustushaku-id hakemus-id submission-id submission-version register-number answers status status-change-comment]
  (let [params (-> {:avustushaku_id avustushaku-id
                    :user_key hakemus-id
                    :user_oid nil
                    :user_first_name nil
                    :user_last_name nil
                    :user_email nil
                    :form_submission_id submission-id
                    :form_submission_version submission-version
                    :register_number register-number
                    :status status
                    :status_change_comment status-change-comment}
                   (merge-calculated-params avustushaku-id answers))]
    (exec-all :form-db [queries/lock-hakemus params
                   queries/close-existing-hakemus! params
                   queries/update-hakemus-status<! params])))

(defn verify-hakemus [avustushaku-id hakemus-id submission-id submission-version register-number answers]
  (update-status avustushaku-id hakemus-id submission-id submission-version register-number answers :draft nil))

(defn submit-hakemus [avustushaku-id hakemus-id submission-id submission-version register-number answers]
  (update-status avustushaku-id hakemus-id submission-id submission-version register-number answers :submitted nil))

(defn cancel-hakemus [avustushaku-id hakemus-id submission-id submission-version register-number answers comment]
  (update-status avustushaku-id hakemus-id submission-id submission-version register-number answers :cancelled comment))

(defn attachment-exists? [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec :form-db queries/attachment-exists?)
       first))

(defn convert-attachment [hakemus-id attachment]
  {:id (:id attachment)
   :hakemus-id hakemus-id
   :version (:version attachment)
   :field-id (:field_id attachment)
   :file-size (:file_size attachment)
   :content-type (:content_type attachment)
   :hakemus-version (:hakemus_version attachment)
   :created-at (:created_at attachment)
   :filename (:filename attachment)})

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
      (exec-all :form-db [queries/close-existing-attachment! params
                     queries/update-attachment<! params])
      (exec :form-db queries/create-attachment<! params))))

(defn close-existing-attachment! [hakemus-id field-id]
  (->> {:hakemus_id hakemus-id
        :field_id field-id}
       (exec :form-db queries/close-existing-attachment!)))

(defn list-attachments [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec :form-db queries/list-attachments)))

(defn get-attachments [external-hakemus-id hakemus-id]
  (->> (list-attachments hakemus-id)
       (map (partial convert-attachment external-hakemus-id))
       (map (fn [attachment] [(:field-id attachment) attachment]))
       (into {})))

(defn download-attachment [hakemus-id field-id]
  (let [result (->> {:hakemus_id hakemus-id
                     :field_id field-id}
                    (exec :form-db queries/download-attachment)
                    first)]
    {:data (io/input-stream (:file_data result))
     :content-type (:content_type result)
     :filename (:filename result)
     :size (:file_size result)}))
