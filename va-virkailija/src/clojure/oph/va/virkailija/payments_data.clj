(ns oph.va.virkailija.payments-data
  (:require
   [oph.soresu.common.db :refer [exec]]
   [oph.va.virkailija.utils
    :refer [convert-to-dash-keys convert-to-underscore-keys]]
   [clj-time.coerce :as c]
   [clj-time.core :as t]
   [oph.va.virkailija.db.queries :as queries]
   [oph.va.virkailija.application-data :as application-data]
   [oph.va.virkailija.invoice :as invoice]))

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

(defn- get-user-info [identity]
  {:user-oid (:person-oid identity)
   :user-name (format "%s %s" (:first-name identity) (:surname identity))})

(defn update-payment [payment-data identity]
  (let [old-payment (get-payment (:id payment-data) (:version payment-data))
        payment (dissoc (merge old-payment payment-data (get-user-info identity))
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

(defn create-payment [payment-data identity]
  (when
   (not
    (empty?
     (exec :form-db queries/get-application-payments
           {:application_id (:application-id payment-data)})))
    (throw
     (Exception. "Application already contains a payment")))
  (let [application (application-data/get-application
                     (:application-id payment-data))]
    (-> payment-data
        (assoc :application-version (:version application)
               :grant-id (:grant-id application))
        (merge (get-user-info identity))
        convert-timestamps-to-sql
        convert-to-underscore-keys
        store-payment
        first
        convert-to-dash-keys
        convert-timestamps-from-sql)))

(defn get-by-rn-and-date [values]
  (->> values
       convert-to-underscore-keys
       (exec :form-db queries/get-by-rn-and-date)
       (map convert-to-dash-keys)))

(defn update-state-by-response [xml]
  (let [response-values (invoice/read-response-xml xml)
        payments (get-by-rn-and-date response-values)
        payment (first payments)]
    (cond (empty? payments) (throw (Exception. "No payment found"))
          (> (count payments) 1)
          (throw (Exception. "Multiple payments found with the same register
                              number and invoice date"))
          (not= (:state payment) 2)
          (throw (Exception. "Payment is not sent to Rondo or it's state is
                              not valid. It should be 2 in this stage.")))
    (update-payment (assoc payment :state 3)
                    {:person-oid "-" :first-name "Rondo" :surname ""})))
