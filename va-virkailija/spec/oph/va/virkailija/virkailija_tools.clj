(ns oph.va.virkailija.virkailija-tools
  (:require [yesql.core :refer [defquery]]
            [oph.soresu.common.db :refer [exec exec-all]]))

(defquery set-all-unhandled!
  "sql/spec/virkailija/set-all-evaluations-unhandled.sql")

(defquery delete-payment-batches!
  "sql/spec/virkailija/delete-payment-batches.sql")

(defn set-all-evaluations-unhandled []
  (exec :virkailija-db set-all-unhandled! {}))

(defn delete-payment-batches []
  (exec :virkailija-db delete-payment-batches! {}))
