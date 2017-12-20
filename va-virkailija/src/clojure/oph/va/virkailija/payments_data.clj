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

(defn next-installment-number []
  (convert-to-dash-keys
   (first (exec :form-db queries/get-next-payment-installment-number {}))))

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

(defn create-payment [payment-data]
  (when
   (not
    (empty?
     (exec :form-db hakija-queries/get-application-payments
           {:application_id (:application-id payment-data)})))
    (throw
     (Exception. "Application already contains a payment")))
  (let [application (application-data/get-application
                      (:application-id payment-data))
        payment {:application_id (:application-id payment-data)
                 :application_version (:version application)
                 :grant_id (:grant-id application)
                 :state 0
                 :document_type (get payment-data :document-type "XA")
                 :invoice_date  (get payment-data :invoice-date
                                     (c/to-sql-time (t/now)))
                 :due_date (get payment-data :due-date
                                (c/to-sql-time (t/now)))
                 :receipt_date (get payment-data :receipt-date
                                    (c/to-sql-time (t/now)))
                 :transaction_account (get payment-data :transaction-account "")
                 :currency (get payment-data :currency "EUR")
                 :partner (get payment-data :partner "")
                 :inspector_email (get payment-data :inspector-email "")
                 :acceptor_email (get payment-data :acceptor-email "")
                 :organisation (get payment-data :organisation "")
                 :installment_number (get payment-data :installment-number 0)}
        payment-id
        (:id (first (exec :form-db hakija-queries/create-payment payment)))]
    (get-payment payment-id)))
