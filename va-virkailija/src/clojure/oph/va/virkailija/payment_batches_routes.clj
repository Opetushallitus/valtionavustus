(ns oph.va.virkailija.payment-batches-routes
  (:require [compojure.api.sweet :as compojure-api]
            [ring.util.http-response :refer [ok not-found]]
            [oph.va.virkailija.payment-batches-data :as data]
            [oph.va.virkailija.schema :as schema])
  (:import (java.time LocalDate)))

(defn- find-payment-batch []
  (compojure-api/GET
    "/" []
    :query-params [date :- LocalDate grant-id :- Long]
    :summary "Find payment batch by date and grant id"
    (if-let [batch (data/find-batch date grant-id)]
      (ok batch)
      (not-found))))

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

(compojure-api/defroutes
  routes
  "payment batches routes"
  (find-payment-batch)
  (create-payment-batch))
