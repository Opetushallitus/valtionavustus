(ns oph.va.virkailija.payments-data
  (:require
   [oph.soresu.common.db :refer [exec]]
   [oph.va.hakija.api :refer [convert-to-dash-keys]]
   [clj-time.coerce :as c]
   [oph.va.virkailija.db.queries :as queries]))

(defn get-payment [id]
  (convert-to-dash-keys
   (first
    (exec :form-db queries/get-payment {:id id}))))

(defn close-version [id version]
  (exec :form-db queries/payment-close-version
        {:id id :version version}))

(defn update-payment [payment-data]
  (let [payment {:payment_id (:id payment-data)
                 :state (:state payment-data)
                 :document_type (:document-type payment-data)
                 :invoice_date  (c/to-sql-time (:invoice-date payment-data))
                 :due_date (c/to-sql-time (:due-date payment-data))
                 :receipt_date (c/to-sql-time (:receipt-date payment-data))
                 :transaction_account (:transaction-account payment-data)
                 :currency (:currency payment-data)
                 :partner (:partner payment-data)
                 ; :inspector_email (:inspector-email payment-data)
                 ; :acceptor_email (:acceptor-email payment-data)
                 :organisation (:organisation payment-data)
                 :installment_number (:installment-number payment-data)}]
    (close-version (:id payment-data) (:version payment-data))
    (convert-to-dash-keys
     (first (exec :form-db queries/update-payment payment)))))
