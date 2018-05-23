(ns oph.va.virkailija.application-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.application-data :as application-data]
            [ring.util.http-response :refer [ok not-found]]
            [compojure.core :as compojure]
            [oph.va.virkailija.schema :as virkailija-schema]))

(defn- get-payments-history []
  (compojure-api/GET
    "/:id/payments-history/" [id :as request]
    :path-params [id :- Long]
    :summary "Get payment history"
    (ok (application-data/get-payments-history id))))

(defn- get-payments []
  (compojure-api/GET
    "/:id/payments/" [id :as request]
    :path-params [id :- Long]
    :summary "Get application payments"
    (ok (application-data/get-application-payments id))))

(defn- get-applications []
  (compojure-api/GET "/" []
    :path-params []
    :query-params [{search :- String ""}]
    :return [virkailija-schema/Application]
    :summary "Return list of applications"
    (ok
      (if (not (empty? search))
        (application-data/find-applications search)
        (not-found "No route found")))))

(compojure-api/defroutes routes
  "application routes"
  (get-payments-history)
  (get-payments)
  (get-applications))
