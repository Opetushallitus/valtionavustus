(ns oph.va.virkailija.payments-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.hakija.application-data :as application-data]
            [ring.util.http-response :refer [ok not-found]]
            [compojure.core :as compojure]
            [schema.core :as s]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.va.virkailija.rondo-service :as rondo-service]))

(defn- update-payment []
  (compojure-api/PUT "/:payment-id/" [payment-id :as request]
    :path-params [payment-id :- Long]
    :query-params []
    :body [payment-data
           (compojure-api/describe
            virkailija-schema/Payment
            "Update payment")]
    :return virkailija-schema/Payment
    :summary "Create new payment for application"
    (ok (payments-data/update-payment payment-data))))

(defn- update-payment-options []
  (compojure-api/OPTIONS "/:payment-id/"
    [application-id :as request]
    :path-params [payment-id :- Long]
    :query-params []
    :summary "Update payment OPTIONS"
    (ok "")))

(defn- get-next-installment-number []
  (compojure-api/GET "/next-installment-number/" []
    :path-params []
    :return virkailija-schema/PaymentInstallmentNumber
    :summary "Return next installment number"
    (ok (payments-data/next-installment-number))))

(defn- create-payment []
  (compojure-api/POST "/" []
    :body [payment-values
           (compojure-api/describe
            virkailija-schema/Payment
            "Create payments to Rondo")]
    :return virkailija-schema/Payment
    :summary "Create new payment for application. Payment will be sent to Rondo
             and stored to database."
    (let [payment (payments-data/create-payment payment-values)
          filename (format "payment-%d-%d.xml"
                           (:id payment) (System/currentTimeMillis))]
      (rondo-service/send-to-rondo!
       {:payment (payments-data/get-payment (:id payment))
        :application (application-data/get-application
                      (:application-id payment))
        :filename filename})
      (ok (payments-data/update-payment
           (assoc payment :state 2 :filename filename))))))

(defn- create-payment-options []
  (compojure-api/OPTIONS "/"
    [application-id :as request]
    :path-params [application-id :- Long]
    :query-params []
    :summary "Create new payment OPTIONS"
    (ok "")))

(compojure-api/defroutes routes
  "payment routes"
  (update-payment)
  (update-payment-options)
  (get-next-installment-number)
  (create-payment)
  (create-payment-options))
