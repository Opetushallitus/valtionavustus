(ns oph.va.virkailija.application-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.application-data :as application-data]
            [ring.util.http-response :refer [ok]]))

(defn- get-payments []
  (compojure-api/GET
    "/:id/payments/" [id]
    :path-params [id :- Long]
    :summary "Get application payments"
    (ok (application-data/get-application-payments id))))

(compojure-api/defroutes routes
  "application routes"
  (get-payments))
