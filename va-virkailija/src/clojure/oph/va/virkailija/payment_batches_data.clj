(ns oph.va.virkailija.payment-batches-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.db.queries :as queries]
            [oph.va.virkailija.utils
             :refer [convert-to-dash-keys convert-to-underscore-keys]]
            [oph.va.virkailija.payments-data
             :refer [convert-timestamps-from-sql]]))

(defn find-batch [date grant-id]
  (-> (exec :form-db queries/find-batch {:batch_date date :grant_id grant-id})
      first
      convert-to-dash-keys
      convert-timestamps-from-sql))

(defn create-batch [values]
  (->> values
       convert-to-underscore-keys
       (exec :form-db queries/create-batch)
       first
       convert-to-dash-keys
       convert-timestamps-from-sql))

(defn get-batch [id]
  (-> (exec :form-db queries/get-batch {:batch_id id})
      first
      convert-to-dash-keys
      convert-timestamps-from-sql))
