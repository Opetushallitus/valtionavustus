(ns oph.va.virkailija.payment-batches-routes
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<!!]]
            [compojure.api.sweet :as compojure-api]
            [ring.util.http-response
             :refer [ok no-content conflict bad-request]]
            [oph.va.virkailija.payment-batches-data :as data]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.va.virkailija.schema :as schema]
            [oph.va.virkailija.authentication :as authentication]
            [oph.va.virkailija.utils :refer [either?]])
  (:import (java.time LocalDate)))

(defn- find-payment-batches []
  (compojure-api/GET
    "/" []
    :query-params [date :- LocalDate grant-id :- Long]
    :return [schema/PaymentBatch]
    :summary "Find payment batches by date and grant id"
    (if-let [batches (data/find-batches date grant-id)]
      (ok batches)
      (no-content))))

(defn- create-payment-batch []
  (compojure-api/POST
    "/" [:as request]
    :body [batch-values
           (compojure-api/describe schema/PaymentBatch
                                   "Create payment batch")]
    :return schema/PaymentBatch
    :summary "Create new payment batch"
    (if (seq (data/find-batches
               (:receipt-date batch-values) (:grant-id batch-values)))
      (conflict {:error "Payment batch already exists"})
      (ok (data/create-batch batch-values)))))

(defn- update-payments []
  (compojure-api/PUT
    "/:id/payments/" [id :as request]
    :path-params [id :- Long]
    :body [data (compojure-api/describe schema/SimplePayment "Payment update values")]
    :summary "Update batch payments"
    (if (= (:paymentstatus-id data) "paid")
      (let [batch (data/get-batch id)]
        (data/set-payments-paid
          {:identity (authentication/get-request-identity request)
           :grant-id (:grant-id batch)})
        (ok ""))
      (bad-request "Only updating paymentstatus to paid is allowed"))))

(defn- send-payments []
  (compojure-api/POST
    "/:id/payments/" [id :as request]
    :path-params [id :- Long]
    :return schema/PaymentsCreateResult
    :summary "Create new payments for unpaid applications of grant. Payments
              will be sent to Rondo and stored to database."
    (ok (data/send-payments-with-id id request))))

(defn- get-documents []
  (compojure-api/GET
    "/:id/documents/" []
    :path-params [id :- Long]
    :return [schema/BatchDocument]
    :summary "Get payment batch documents"
    (ok (data/get-batch-documents id))))

(defn- create-document []
  (compojure-api/POST
    "/:id/documents/" []
    :path-params [id :- Long]
    :body [document
           (compojure-api/describe schema/NewBatchDocument
                                   "Payment batch document")]
    :return schema/BatchDocument
    :summary "Create new payment batch document"
    (if (some
          #(when (= (:phase %) (:phase document)) %)
          (data/get-batch-documents id))
      (conflict {:error "No multiple documents per phase is allowed"})
      (ok (data/create-batch-document id document)))))

(defn- send-payments-email []
  (compojure-api/POST
    "/:id/payments-email/" []
    :path-params [id :- Long]
    :summary "Send batch payments email"
    (data/send-batch-emails id)
    (ok "")))

(compojure-api/defroutes
  routes
  "payment batches routes"
  (find-payment-batches)
  (create-payment-batch)
  (update-payments)
  (send-payments)
  (get-documents)
  (create-document)
  (send-payments-email))
