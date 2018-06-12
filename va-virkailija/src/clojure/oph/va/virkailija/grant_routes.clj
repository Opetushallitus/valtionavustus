(ns oph.va.virkailija.grant-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.va.virkailija.payments-data :as payments-data]
            [ring.util.http-response :refer [ok unauthorized]]
            [schema.core :as s]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.va-code-values-routes :refer [with-admin]]
            [oph.va.virkailija.authentication :as authentication]))

(defn- get-grants []
  (compojure-api/GET "/" []
    :path-params []
    :query-params [{template :- String ""}, {search :- String ""}]
    :return virkailija-schema/Grants
    :summary "Return list of grants"
    (ok
      (cond
        (= template "with-content")
        (grant-data/get-resolved-grants-with-content)
        (seq search)
        (grant-data/find-grants search)
        :else (grant-data/get-grants)))))

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
    (ok (payments-data/get-valid-grant-payments grant-id))))

(defn- delete-payments []
  (compojure-api/DELETE
    "/:id/payments/" [id :as request]
    :path-params [id :- Long]
    :return s/Any
    :summary "Delete grant payments"
    (when-not (get-in config [:payments :delete-payments?])
      (throw (Exception. "Route not allowed")))
    (payments-data/delete-grant-payments id)
    (ok)))

(defn- post-payments []
  (compojure-api/POST
    "/:id/payments/" [id :as request]
    :path-params [id :- Long]
    :return [virkailija-schema/Payment]
    :body [grant-payments-data virkailija-schema/GrantPayment]
    :summary "Create grant payments"
    (with-admin request
      (ok (payments-data/create-grant-payments
            id (:phase grant-payments-data)
            (authentication/get-request-identity request)))
      (unauthorized ""))))

(compojure-api/defroutes routes
  "grant routes"
  (get-grants)
  (get-grant-applications)
  (get-grant-payments)
  (delete-payments)
  (post-payments))
