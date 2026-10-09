(ns oph.va.virkailija.search-routes
  (:require [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.va.virkailija.search-data :as search-data]
            [ring.util.http-response :refer [ok]]))

(defn- get-search []
  (compojure-api/GET "/" []
    :path-params []
    :query-params [{search :- String ""}
                   {order :- String ""}]
    :return virkailija-schema/SearchResults
    :summary "Search applications and grants with comma-separated terms"
    (ok (search-data/search search order))))

(compojure-api/defroutes routes
  "search routes"
  (get-search))
