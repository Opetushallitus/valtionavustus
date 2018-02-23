(ns oph.va.virkailija.payment-batches-routes
  (:require [clojure.core.async :as a]
            [compojure.api.sweet :as compojure-api]
            [ring.util.http-response :refer [ok no-content request-timeout]]
            [oph.va.virkailija.payment-batches-data :as data]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.va.virkailija.application-data :as application-data]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.schema :as schema]
            [oph.va.virkailija.authentication :as authentication])
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

      (let [applications
            (grant-data/get-unpaid-applications (:id grant))
            c (a/chan)]
        (a/go
          (doseq [application applications]
            (let [payment-values {:application-id (:id application)
                                  :application-version (:version application)
                                  :state 0
                                  :batch-id (:id batch)}
                  payment
                  (or (application-data/get-application-payment
                        (:id application))
                      (payments-data/create-payment payment-values identity))
                  filename (format "payment-%d-%d.xml"
                                   (:id payment)
                                   (System/currentTimeMillis))
                  ac (a/chan)]
              (a/go
                (try
                  (rondo-service/send-to-rondo!
                    {:payment (payments-data/get-payment (:id payment))
                     :application application
                     :grant grant
                     :filename filename})
                  (a/>! ac {:success true})
                  (catch Exception e
                    (a/>! ac {:success false :exception e}))))
              (a/alt!
                ac ([v]
                    (prn v)
                    (if (:success v)
                      (payments-data/update-payment
                        (assoc payment :state 2 :filename filename)
                        identity)
                      (do
                        (a/>! c v)
                        (throw (:exception v))))
                    )
                (a/timeout timeout-limit)
                ([_]
                 (a/>! c {:success false :error :timeout})
                 (throw "SSH timeout")))))
          (a/>! c {:success true}))
        (let [result (a/<!! c)]
          (cond
            (:success result) (ok {:success true})
            (= (:error result) :timeout) (request-timeout {:success false})
            :else (throw (:exception result))))))))

(compojure-api/defroutes
  routes
  "payment batches routes"
  (find-payment-batch)
  (create-payment-batch)
  (create-payments)
  (create-dsa))
