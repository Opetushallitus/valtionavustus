(ns oph.va.virkailija.virkailija-tools
  (:require [yesql.core :refer [defquery]]
            [oph.soresu.common.db :refer [exec exec-all]]))

(defquery set-all-unhandled! "sql/virkailija/arvio/set-all-unhandled.sql")

(defn set-all-evaluations-unhandled []
  (exec :virkailija-db set-all-unhandled! {}))
