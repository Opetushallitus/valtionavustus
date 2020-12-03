(ns oph.va.virkailija.muutospaatosprosessi
  (:require [clojure.tools.logging :as log]
            [oph.soresu.common.db :refer [exec get-datasource]]
            [clojure.java.jdbc :as jdbc]
            [oph.soresu.form.formutil :as form-util]))

(defn get-answers [form-submission-id form-submission-version]
  (log/info (str "Get answers for form submission: " form-submission-id " with version: " form-submission-version))
  (let [answers (jdbc/with-db-transaction [connection {:datasource (get-datasource)}]
                                          (jdbc/query
                                            connection
                                            ["SELECT answers from hakija.form_submissions WHERE id = ? AND version = ?" form-submission-id, form-submission-version]
                                            {:identifiers #(.replace % \_ \-)}))]
    (log/info (str "Succesfully fetched answers for form submission: " form-submission-id " with version: " form-submission-version))
    (:answers (first answers))))


(defn hakemus-can-be-normalized? [hakemus]
  (and (some? hakemus) (let [answers (get-answers (:form_submission_id hakemus) (:form_submission_version hakemus))]
    (and (some? (form-util/find-answer-value answers "project-name"))
         (some? (form-util/find-answer-value answers "applicant-name"))
         (some? (form-util/find-answer-value answers "primary-email"))
         (some? (form-util/find-answer-value answers "textField-0"))))))
