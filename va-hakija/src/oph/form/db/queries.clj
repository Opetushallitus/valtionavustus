(ns oph.form.db.queries
  (:require [yesql.core :refer [defquery]]))

(defquery list-forms "sql/form/list.sql")
(defquery get-form "sql/form/get.sql")

(defquery submission-exists? "sql/submission/exists.sql")
(defquery create-submission<! "sql/submission/create.sql")
(defquery update-submission<! "sql/submission/update.sql")
(defquery lock-submission "sql/submission/lock.sql")
(defquery close-existing-submission! "sql/submission/close-existing.sql")
(defquery get-form-submission "sql/submission/get.sql")
(defquery get-form-submission-versions "sql/submission/get-versions.sql")
