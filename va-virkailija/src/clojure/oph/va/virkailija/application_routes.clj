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
    :return virkailija-schema/Application
    :summary "Create new payment for application"
    (ok (application-data/create-payment application-id))))

(defn- create-payment-options []
  (compojure-api/OPTIONS "/:application-id/payments/"
                         [application-id :as request]
    :path-params [application-id :- Long]
    :query-params []
    :summary "Create new payment OPTIONS"
    (ok "")))

(compojure-api/defroutes routes
  "application routes"
  (create-payment)
  (create-payment-options))
