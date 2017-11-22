(ns oph.va.virkailija.payments-data
  (:require
   [oph.soresu.common.db :refer [exec]]
   [oph.va.hakija.api :refer [convert-to-dash-keys convert-to-underscore-keys]]
   [clj-time.coerce :as c]
   [oph.va.virkailija.db.queries :as queries]))

(defn get-payment
  ([id]
   (convert-to-dash-keys
    (first
     (exec :form-db queries/get-payment {:id id}))))
  ([id version]
   (convert-to-dash-keys
    (first
     (exec :form-db queries/get-payment-version {:id id :version version})))))

(defn close-version [id version]
  (exec :form-db queries/payment-close-version
        {:id id :version version}))

(defn- convert-timestamps [m]
  (assoc
   m
   :due-date (c/to-sql-time (:due-date m))
   :receipt-date (c/to-sql-time (:receipt-date m))
   :invoice-date (c/to-sql-time (:receipt-date m))))

(defn update-payment [payment-data]
  (let [old-payment (get-payment (:id payment-data) (:version payment-data))
        payment (dissoc (merge old-payment payment-data)
                        :version :version-closed)
        result
        (convert-to-dash-keys
         (first (exec :form-db queries/update-payment
                      (convert-to-underscore-keys
                       (convert-timestamps payment)))))]
    (when (nil? result) (throw Exception. "Failed to update payment"))
    (close-version (:id payment-data) (:version payment-data))))
