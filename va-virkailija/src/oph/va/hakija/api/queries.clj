(ns oph.va.hakija.api.queries
  (:require [yesql.core :refer [defquery]]))

(defquery health-check "sql/hakija/healthcheck.sql")

(defquery list-hakemukset "sql/hakija/hakemus/list.sql")
