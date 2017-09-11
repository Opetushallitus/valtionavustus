(ns oph.soresu.common.db.queries
  (:require [yesql.core :refer [defquery]]))

(defquery get-koodisto "sql/koodisto/get.sql")
(defquery create-koodisto<! "sql/koodisto/create.sql")
