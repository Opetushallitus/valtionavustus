(ns oph.va.virkailija.virkailija-tools
  (:require [yesql.core :refer [defquery]]
            [oph.soresu.common.db :refer [exec exec-all]]
            [oph.va.virkailija.utils
             :refer [convert-to-underscore-keys update-some]]
            [clj-time.coerce :as c]
            [clj-time.format :as f]
            [clj-time.core :as t]))

(defquery set-all-unhandled!
  "sql/spec/virkailija/set-all-evaluations-unhandled.sql")

(defquery delete-payment-batches!
  "sql/spec/virkailija/delete-payment-batches.sql")

(defquery create-custom-dated-batch!
  "sql/spec/virkailija/create-custom-dated-batch.sql")

(defn set-all-evaluations-unhandled []
  (exec set-all-unhandled! {}))

(defn delete-payment-batches []
  (exec delete-payment-batches! {}))

(defn- parse-date-time [s]
  (c/to-sql-time
    (f/parse (:date-time f/formatters) s)))

(defn- parse-local-date [s]
  (c/to-sql-date
    (f/parse (:local-date f/formatters) s)))

(defn convert-timestamps-to-sql [p]
  (-> p
      (update-some :created-at parse-date-time)
      (update-some :due-date parse-local-date)
      (update-some :invoice-date parse-local-date)
      (update-some :receipt-date parse-local-date)))

(defn create-batch [values]
  (exec create-custom-dated-batch!
        (convert-to-underscore-keys (convert-timestamps-to-sql values))))
