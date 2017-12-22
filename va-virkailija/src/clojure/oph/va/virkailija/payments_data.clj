(ns oph.va.virkailija.payments-data
  (:require
   [oph.soresu.common.db :refer [exec]]
   [oph.va.hakija.api :refer [convert-to-dash-keys convert-to-underscore-keys]]
   [clj-time.coerce :as c]
   [oph.va.hakija.api.queries :as hakija-queries]
   [clj-time.core :as t]
   [clj-time.coerce :as c]
   [oph.va.virkailija.db.queries :as queries]
   [oph.va.hakija.application-data :as application-data]))

(defn- get-keys-present [m ks]
  (keys (select-keys m ks)))

(defn- update-all [m ks f]
  (reduce #(update-in % [%2] f) m ks))

(defn convert-timestamps [m f]
  (let [timestamp-keys
        (get-keys-present
          m [:due-date :invoice-date :receipt-date])]
    (if (empty? timestamp-keys)
      m
      (update-all m timestamp-keys f))))

(defn convert-timestamps-from-sql [m]
  (conj {:created-at (c/from-sql-time (:created-at m))}
        (convert-timestamps m c/from-sql-date)))

(defn convert-timestamps-to-sql [m]
  (conj {:created-at (c/to-sql-time (:created-at m))}
        (convert-timestamps m c/to-sql-date)))

(defn get-payment
  ([id]
   (->
     (exec :form-db queries/get-payment {:id id})
     first
     convert-to-dash-keys
     convert-timestamps-from-sql))
  ([id version]
   (->
     (exec :form-db queries/get-payment-version {:id id :version version})
     first
     convert-to-dash-keys
     convert-timestamps-from-sql)))

(defn close-version [id version]
  (exec :form-db queries/payment-close-version
        {:id id :version version}))

(defn next-installment-number []
  (convert-to-dash-keys
   (first (exec :form-db queries/get-next-payment-installment-number {}))))

(defn update-payment [payment-data]
  (let [old-payment (get-payment (:id payment-data) (:version payment-data))
        payment (dissoc (merge old-payment payment-data)
                        :version :version-closed)
        result
        (->> payment
             convert-timestamps-to-sql
             convert-to-underscore-keys
             (exec :form-db queries/update-payment)
             first
             convert-to-dash-keys)]
    (when (nil? result) (throw (Exception. "Failed to update payment")))
    (close-version (:id payment-data) (:version payment-data))
    result))

(defn- store-payment [payment]
  (exec :form-db queries/create-payment payment))

(defn create-payment [payment-data]
  (when
   (not
    (empty?
     (exec :form-db hakija-queries/get-application-payments
           {:application_id (:application-id payment-data)})))
    (throw
     (Exception. "Application already contains a payment")))
  (let [application (application-data/get-application
                     (:application-id payment-data))]
    (-> payment-data
        (assoc :application-version (:version application))
        (conj (select-keys application [:version :grant-id]))
        convert-timestamps-to-sql
        convert-to-underscore-keys
        store-payment
        first
        convert-to-dash-keys
        convert-timestamps-from-sql)))
