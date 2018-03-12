(ns oph.va.virkailija.payment-batches-routes
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :as a]
            [compojure.api.sweet :as compojure-api]
            [ring.util.http-response :refer [ok no-content request-timeout]]
            [oph.va.virkailija.payment-batches-data :as data]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.va.virkailija.application-data :as application-data]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.schema :as schema]
            [oph.va.virkailija.authentication :as authentication]
            [oph.va.virkailija.utils :refer [with-timeout]])
  (:import (java.time LocalDate)))

(def timeout-limit 10000)

(defn- find-payment-batch []
  (compojure-api/GET
    "/" []
    :query-params [date :- LocalDate grant-id :- Long]
    :summary "Find payment batch by date and grant id"
    (if-let [batch (data/find-batch date grant-id)]
      (ok batch)
      (no-content))))

(defn- create-payment-batch []
  (compojure-api/POST
    "/" [:as request]
    :body [batch-values
           (compojure-api/describe schema/PaymentBatch
                                   "Create payment batch")]
    :return schema/PaymentBatch
    :summary "Create new payment batch"
    (when (data/find-batch (:batch-date batch-values) (:grant-id batch-values))
      (throw
        (Exception.
          "Payment batch already found for given grant and current date.")))
    (ok (data/create-batch batch-values))))

(defn create-payment-values [application batch]
  {:application-id (:id application)
   :application-version (:version application)
   :state 0
   :batch-id (:id batch)})

(defn- create-payments []
  (compojure-api/POST
    "/:id/payments/" [id :as request]
    :path-params [id :- Long]
    :return schema/PaymentsCreateResult
    :summary "Create new payments for unpaid applications of grant. Payments
              will be sent to Rondo and stored to database."
    (let [identity (authentication/get-request-identity request)
          batch (data/get-batch id)
          grant (grant-data/get-grant (:grant-id batch))]
      (when (get-in grant [:content :multiplemaksuera])
        (throw (Exception. "Multiple payment batches is not supported.")))

      (let [applications (grant-data/get-unpaid-applications (:id grant))
            c (a/chan)]
        (a/go
          (doseq [application applications]
            (let [payment
                  (or (application-data/get-application-payment
                        (:id application))
                      (payments-data/create-payment
                        (create-payment-values application batch) identity))
                  filename (format "payment-%d-%d.xml"
                                   (:id payment) (System/currentTimeMillis))]
              (let [result
                    (with-timeout
                      #(try
                         (rondo-service/send-to-rondo!
                           {:payment (payments-data/get-payment (:id payment))
                            :application application
                            :grant grant
                            :filename filename})
                         (catch Exception e
                           {:success false :error-type :exception :exception e}))
                      timeout-limit
                      {:success false :error-type :timeout})]
                (if (:success result)
                  (payments-data/update-payment
                    (assoc payment :state 2 :filename filename) identity)
                  (a/>! c (:error-type result))))))
          (a/close! c))
        (let [error-count
              (loop [error-count 0]
                (if-let [error (a/<!! c)]
                  (do (log/error error)
                      (recur (inc error-count)))
                  error-count))]
          (ok {:success (= error-count 0)}))))))

(compojure-api/defroutes
  routes
  "payment batches routes"
  (find-payment-batch)
  (create-payment-batch)
  (create-payments))
