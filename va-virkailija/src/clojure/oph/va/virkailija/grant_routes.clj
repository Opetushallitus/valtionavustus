(ns oph.va.virkailija.grant-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.grant-data :as grant-data]
            [ring.util.http-response :refer [ok not-found]]
            [compojure.core :as compojure]
            [schema.core :as s]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.soresu.common.config :refer [config]]))

(defn- get-grants []
  (compojure-api/GET "/" []
    :path-params []
    :query-params [{template :- String ""}]
    :return virkailija-schema/Grants
    :summary "Return list of grants"
    (ok (if (= template "with-content")
          (grant-data/get-resolved-grants-with-content)
          (grant-data/get-grants)))))

(defn- get-grant-applications []
  (compojure-api/GET
    "/:grant-id/applications/" [grant-id :as request]
    :path-params [grant-id :- Long]
    :query-params [{template :- String ""}]
    :return [virkailija-schema/Application]
    :summary "Return applications of a grant"
    (ok (if (= template "with-evaluation")
          (grant-data/get-grant-applications-with-evaluation grant-id)
          (grant-data/get-grant-applications grant-id)))))

(defn- get-grant-payments []
  (compojure-api/GET
    "/:grant-id/payments/" [grant-id :as request]
    :path-params [grant-id :- Long]
    :return [virkailija-schema/Payment]
    :summary "Return payments of a grant"
    (ok (grant-data/get-grant-payments grant-id))))

(defn- delete-payments []
  (compojure-api/DELETE
    "/:id/payments/" [id :as request]
    :path-params [id :- Long]
    :return s/Any
    :summary "Delete grant payments"
    (when-not (get-in config [:payments :delete-payments?])
      (throw (Exception. "Route not allowed")))
    (grant-data/delete-grant-payments id)
    (ok)))

(defn- post-payments-email []
  (compojure-api/POST
    "/:id/payments-email/" [id :as request]
    :path-params [id :- Long]
    :body [payments-info virkailija-schema/PaymentsEmail]
    :summary "Send payments information email"
    (grant-data/send-payments-email (merge {:grant-id id} payments-info))))

(compojure-api/defroutes routes
  "grant routes"
  (get-grants)
  (get-grant-applications)
  (get-grant-payments)
  (delete-payments)
  (post-payments-email))
