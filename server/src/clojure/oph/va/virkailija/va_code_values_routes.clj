(ns oph.va.virkailija.va-code-values-routes
  (:require [compojure.api.sweet :as compojure-api]
            [ring.util.http-response :refer [ok method-not-allowed unauthorized]]
            [oph.va.virkailija.va-code-values-data :as data]
            [oph.va.virkailija.schema :as schema]
            [oph.va.virkailija.authentication :as authentication]))

(defn has-privilege? [identity privilege]
  (true?
   (some #(= % privilege) (:privileges identity))))

(defmacro with-admin [request form unauthorized]
  `(if (has-privilege?
        (authentication/get-request-identity ~request) "va-admin")
     ~form
     ~unauthorized))

(defn- get-va-code-values []
  (compojure-api/GET
    "/" [:as request]
    :query-params [{value-type :- String nil}, {year :- Long nil}]
    :return [schema/VACodeValue]
    :summary "Get all VA code values"
    (ok (data/get-va-code-values value-type year))))

(defn- create-va-code-value []
  (compojure-api/POST
    "/" [:as request]
    :body [code-values (compojure-api/describe schema/CreateVACodeValue
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

(defn- edit-va-code-value []
  (compojure-api/POST
    "/:id/" [id :as request]
    :path-params [id :- Long]
    :body [code-value (compojure-api/describe schema/VACodeValueEdit
                                              "Edit existing Code Value")]
    :summary "Edit existing Code Value"
    (with-admin request
      (do (data/edit-va-code-value! id code-value)
          (ok ""))
      (unauthorized ""))))

(compojure-api/defroutes
  routes
  "va-code values routes"
  (get-va-code-values)
  (create-va-code-value)
  (delete-va-code-value)
  (edit-va-code-value))
