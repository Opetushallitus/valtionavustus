(ns oph.va.virkailija.reporting-routes
  (:require
   [compojure.api.sweet :as compojure-api]
   [ring.util.http-response :refer [ok]]
   [schema.core :as s]
   [ring.util.http-response :refer [ok]]
   [oph.va.virkailija.schema :as schema]
   [oph.va.virkailija.reporting-data :as data]))

(compojure-api/defroutes routes
  "Reports"

  (compojure-api/GET
    "/" request
    :return s/Any
    :summary "Simple yearly reporting overview"
    (ok (data/get-yearly-report)))

  (compojure-api/GET
    "/grants/" request
    :return schema/YearlyReport
    :summary "Yearly resolved grants report"
    (ok (data/get-yearly-resolved-count)))

  (compojure-api/GET
    "/applications/" request
    :query-params [applications-filter :- s/Str]
    :return schema/YearlyReport
    :summary "Yearly applications count"
    (ok
      (case applications-filter
        "count" (data/get-yearly-application-count)
        "accepted" (data/get-accepted-count-by-year)
        "rejected" (data/get-rejected-count-by-year)))))
