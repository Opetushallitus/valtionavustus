(ns oph.va.db.queries
  (:require [yesql.core :refer [defquery]]))

(defquery list-forms "sql/list-forms.sql")
(defquery get-form "sql/get-form.sql")

(defquery submission-exists? "sql/submission-exists.sql")
(defquery create-submission<! "sql/create-submission.sql")
(defquery update-submission<! "sql/update-submission.sql")
(defquery get-form-submission "sql/get-form-submission.sql")
