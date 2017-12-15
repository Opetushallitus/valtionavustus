(ns oph.va.hakija.application-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.hakija.api :refer [convert-to-dash-keys]]
            [clj-time.core :as t]
            [clj-time.coerce :as c]
            [oph.va.hakija.grant-data :as grant-data]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.db.queries :as virkailija-queries])
  (:import (oph.va.jdbc.enums)))

(defn get-application [id]
  (convert-to-dash-keys
   (first
    (exec :form-db hakija-queries/get-application {:application_id id}))))

(defn get-application-with-evaluation-and-answers [id]
  (convert-to-dash-keys
   (first
    (exec :form-db hakija-queries/get-application-with-evaluation-and-answers
          {:application_id id}))))

(defn create-payment [application-id payment-data]
  (when
   (not
    (empty?
     (exec :form-db hakija-queries/get-application-payments
           {:application_id application-id})))
    (throw
     (Exception. "Application already contains a payment")))
  (let [application (get-application application-id)
        payment {:application_id application-id
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
    (payments-data/get-payment payment-id)))

(defn get-payments-history [id]
  (mapv
   convert-to-dash-keys
   (exec :form-db virkailija-queries/get-payment-history
         {:application_id id})))
