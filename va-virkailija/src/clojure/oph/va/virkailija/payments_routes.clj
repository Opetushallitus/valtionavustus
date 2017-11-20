(ns oph.va.virkailija.payments-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.payments-data :as payments-data]
            [ring.util.http-response :refer [ok not-found]]
            [compojure.core :as compojure]
            [schema.core :as s]
            [oph.va.virkailija.schema :as virkailija-schema]))

(defn- update-payment []
  (compojure-api/POST "/:payment-id/" [payment-id :as request]
    :path-params [payment-id :- Long]
    :query-params []
    :body [payment-data
           (compojure-api/describe
            virkailija-schema/Payment
            "Update payment")]
    :return virkailija-schema/Payment
    :summary "Create new payment for application"
    (ok (payments-data/update-payment payment-id payment-data))))

(defn- update-payment-options []
  (compojure-api/OPTIONS "/:payment-id/"
    [application-id :as request]
    :path-params [payment-id :- Long]
    :query-params []
    :summary "Update payment OPTIONS"
    (ok "")))

(compojure-api/defroutes routes
  "payment routes"
  (update-payment)
  (update-payment-options))
