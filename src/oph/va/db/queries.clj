(ns oph.va.db.queries
  (:require [yesql.core :refer [defquery]]
            [yesql.util :refer [slurp-from-classpath]]))

;; This query is used in tests to clear the db
(def clear-db! (slurp-from-classpath "db/clear-db.sql"))

(defquery list-forms "sql/list-forms.sql")
(defquery get-form "sql/get-form.sql")
(defquery create-submission<! "sql/create-submission.sql")
(defquery update-submission<! "sql/update-submission.sql")
(defquery get-form-submission "sql/get-form-submission.sql")
