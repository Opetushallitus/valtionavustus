(ns oph.va.virkailija.va-code-values-routes
  (:require [compojure.api.sweet :as compojure-api]
            [ring.util.http-response :refer [ok]]
            [oph.va.virkailija.va-code-values-data :as data]
            [oph.va.virkailija.schema :as schema]))

(defn- get-va-code-values []
  (compojure-api/GET
    "/" [:as request]
    :query-params [value-type :- String, year :- Long]
    :return [schema/VACodeValue]
    :summary "Get all VA code values"
    (ok (data/get-va-code-values value-type year))))

(defn- create-va-code-value []
  (compojure-api/POST
    "/" [:as request]
    :body [code-values (compojure-api/describe schema/VACodeValue
                                                 "Create VA Code Value")]
    :return schema/VACodeValue
    :summary "Create new VA Code Value"
    (ok (data/create-va-code-value code-values))))

(compojure-api/defroutes
  routes
  "va-code values routes"
  (get-va-code-values)
  (create-va-code-value))
