(ns oph.va.virkailija.db.queries
  (:require [yesql.core :refer [defquery]]))

(defquery health-check "sql/healthcheck.sql")
