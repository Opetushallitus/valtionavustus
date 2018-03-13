(ns oph.va.virkailija.va-code-values-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.authentication :as authentication]
            [ring.util.http-response :refer [ok method-not-allowed unauthorized]]
            [oph.va.virkailija.va-code-values-data :as data :refer [with-admin]]
            [oph.va.virkailija.schema :as schema]))

(defn- get-va-code-values []
  (compojure-api/GET
    "/" [:as request]
    :query-params [{value-type :- String nil}, {year :- Long nil}]
    :return [schema/VACodeValue]
    :summary "Get all VA code values"
    (with-admin request
      (ok (data/get-va-code-values value-type year))
      (unauthorized ""))))

(defn- create-va-code-value []
  (compojure-api/POST
    "/" [:as request]
    :body [code-values (compojure-api/describe schema/VACodeValue
                                               "Create VA Code Value")]
    :return schema/VACodeValue
    :summary "Create new VA Code Value"
    (with-admin request
      (ok (data/create-va-code-value code-values))
      (unauthorized ""))))

(defn- delete-va-code-value []
  (compojure-api/DELETE
    "/:id/" [id :as request]
    :path-params [id :- Long]
    :summary
    "Delete VA Code value. Only unused codes are allowed to be deleted"
    (with-admin request
      (if (data/code-used? id)
        (method-not-allowed)
        (do (data/delete-va-code-value! id)
            (ok "")))
      (unauthorized ""))))

(compojure-api/defroutes
  routes
  "va-code values routes"
  (get-va-code-values)
  (create-va-code-value)
  (delete-va-code-value))
