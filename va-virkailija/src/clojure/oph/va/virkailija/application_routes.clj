(ns oph.va.virkailija.application-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.application-data :as application-data]
            [ring.util.http-response :refer [ok not-found]]
            [compojure.core :as compojure]
            [schema.core :as s]
            [oph.va.virkailija.schema :as virkailija-schema]))

(defn- get-payments-history []
  (compojure-api/GET
    "/:id/payments-history/" [id :as request]
    :path-params [id :- Long]
    :summary "Get payment history"
    (ok (application-data/get-payments-history id))))

(compojure-api/defroutes routes
  "application routes"
  (get-payments-history))
