(ns oph.va.virkailija.db.external-queries
  (:require [yesql.core :refer [defquery]]))

(defquery get-grants-for-year "sql/virkailija/grants/get-grants-for-year.sql")
