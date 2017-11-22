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

(defn- get-keys-present [m ks]
  (keys (select-keys m ks)))

(defn- update-all [m ks f]
  (reduce #(update-in % [%2] f) m ks))

(defn convert-timestamps [m]
  (let [timestamp-keys
        (get-keys-present m [:due-date :invoice-date :receipt-date])]
    (if (empty? timestamp-keys)
      m
      (update-all m timestamp-keys c/to-sql-time))))

(defn update-payment [payment-data]
  (let [old-payment (get-payment (:id payment-data) (:version payment-data))
        payment (dissoc (merge old-payment payment-data)
                        :version :version-closed)
        result
        (->> payment
            convert-timestamps
            convert-to-underscore-keys
            (exec :form-db queries/update-payment)
            first
            convert-to-dash-keys)]
    (when (nil? result) (throw (Exception. "Failed to update payment")))
    (close-version (:id payment-data) (:version payment-data))
    result))
