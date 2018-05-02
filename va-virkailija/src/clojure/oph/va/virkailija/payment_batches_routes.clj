(ns oph.va.virkailija.payment-batches-routes
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<!!]]
            [compojure.api.sweet :as compojure-api]
            [ring.util.http-response
             :refer [ok no-content request-timeout conflict]]
            [oph.va.virkailija.payment-batches-data :as data]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.va.virkailija.schema :as schema]
            [oph.va.virkailija.authentication :as authentication]
            [oph.va.virkailija.utils :refer [either?]])
  (:import (java.time LocalDate)))

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
    (if (some?
          (data/find-batch
            (:receipt-date batch-values) (:grant-id batch-values)))
      (conflict "Payment batch already exists")
      (ok (data/create-batch batch-values)))))

(defn- create-payments []
  (compojure-api/POST
    "/:id/payments/" [id :as request]
    :path-params [id :- Long]

    :return schema/PaymentsCreateResult
    :summary "Create new payments for unpaid applications of grant. Payments
              will be sent to Rondo and stored to database."
    (let [batch (data/get-batch id)
          c (data/create-payments
              {:batch batch
               :grant (grant-data/get-grant (:grant-id batch))
               :identity (authentication/get-request-identity request) } )]
      (let [result
            (loop [total-result {:count 0 :error-count 0 :errors '()}]
              (if-let [r (<!! c)]
                (if (or (:success r)
                        (either? (get-in r [:error :error-type])
                                 #{:already-paid :no-payments}))
                  (recur (update total-result :count inc))
                  (do (when (= (get-in r [:error :error-type]) :exception)
                        (log/error (get-in r [:error :exception])))
                      (recur (-> total-result
                                 (update :count inc)
                                 (update :error-count inc)
                                 (update :errors conj (:error r))))))
                total-result))]
        (ok {:success
             (and (= (:error-count result) 0) (> (:count result) 0))
             :errors (map :error-type (:errors result))})))))

(compojure-api/defroutes
  routes
  "payment batches routes"
  (find-payment-batch)
  (create-payment-batch)
  (create-payments))
