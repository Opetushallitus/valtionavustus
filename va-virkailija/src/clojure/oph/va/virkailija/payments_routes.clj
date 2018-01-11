(ns oph.va.virkailija.payments-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.application-data :as application-data]
            [oph.va.virkailija.grant-data :as grant-data]
            [ring.util.http-response :refer [ok not-found]]
            [compojure.core :as compojure]
            [schema.core :as s]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.va.virkailija.rondo-service :as rondo-service]))

(defn- update-payment []
  (compojure-api/PUT
    "/:payment-id/" [payment-id :as request]
    :path-params [payment-id :- Long]
    :query-params []
    :body [payment-data
     (compojure-api/describe virkailija-schema/Payment
                             "Update payment")]
    :return virkailija-schema/Payment
    :summary "Create new payment for application"
    (ok (payments-data/update-payment payment-data))))

(defn- get-next-installment-number []
  (compojure-api/GET
    "/next-installment-number/" []
    :path-params []
    :return virkailija-schema/PaymentInstallmentNumber
    :summary "Return next installment number"
    (ok (payments-data/next-installment-number))))

(defn- create-payment []
  (compojure-api/POST
    "/" []
    :body [payment-values
     (compojure-api/describe virkailija-schema/Payment
                             "Create payments to Rondo")]
    :return virkailija-schema/Payment
    :summary "Create new payment for application. Payment will be sent to Rondo
             and stored to database."
    (let [payment (or (application-data/get-application-payment
                        (:application-id payment-values))
                      (payments-data/create-payment payment-values))
          application
            (application-data/get-application-with-evaluation-and-answers
              (:application-id payment))
          grant (grant-data/get-grant (:grant-id application))
          filename (format "payment-%d-%d.xml"
                           (:id payment)
                           (System/currentTimeMillis))]
      (when (get-in grant [:content :multiplemaksuera])
        (throw (Exception. "Multiple installments is not supported.")))
      (when (= (:state payment) 2)
        (throw (Exception. "Application already has a payment sent to Rondo")))
      (rondo-service/send-to-rondo!
        {:payment (payments-data/get-payment (:id payment))
         :application application
         :grant grant
         :filename filename})
      (ok (payments-data/update-payment
            (assoc payment :state 2 :filename filename))))))

(compojure-api/defroutes
  routes
  "payment routes"
  (update-payment)
  (get-next-installment-number)
  (create-payment))
