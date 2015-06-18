(ns oph.va.db.queries
  (:require [yesql.core :refer [defquery]]))

(defquery create-hakemus<! "sql/hakemus/create.sql")
(defquery get-hakemus "sql/hakemus/get.sql")
(defquery update-hakemus<! "sql/hakemus/update.sql")

(defquery get-avustushaku "sql/avustushaku/get.sql")
