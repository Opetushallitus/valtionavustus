(ns oph.va.virkailija.application-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.hakija.application-data :as application-data]
            [ring.util.http-response :refer [ok not-found]]
            [compojure.core :as compojure]
            [schema.core :as s]
            [oph.va.virkailija.schema :as virkailija-schema]))

(defn- create-payment []
  (compojure-api/POST "/:application-id/payments/" [application-id :as request]
    :path-params [application-id :- Long]
    :query-params []
    :body [payment-emails
           (compojure-api/describe
            virkailija-schema/NewPayment
            "Create payments")]
    :return virkailija-schema/Payment
    :summary "Create new payment for application"
    (ok (application-data/create-payment application-id payment-emails))))

(defn- create-payment-options []
  (compojure-api/OPTIONS "/:application-id/payments/"
    [application-id :as request]
    :path-params [application-id :- Long]
    :query-params []
    :summary "Create new payment OPTIONS"
    (ok "")))

(defn- get-payments-history []
  (compojure-api/GET
    "/:id/payments-history/" [id :as request]
    :path-params [id :- Long]
    :summary "Get payment history"
    (ok (application-data/get-payments-history id))))

(compojure-api/defroutes routes
  "application routes"
  (create-payment)
  (create-payment-options)
  (get-payments-history))
