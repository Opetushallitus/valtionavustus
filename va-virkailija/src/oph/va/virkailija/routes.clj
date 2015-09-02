(ns ^{:skip-aot true} oph.va.virkailija.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [compojure.route :as route]
            [clojure.tools.logging :as log]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [defroutes GET]]
            [compojure.api.sweet :refer :all]
            [compojure.api.exception :as compojure-ex]
            [schema.core :as s]
            [oph.common.config :refer [config config-simple-name]]
            [oph.common.routes :refer :all]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.schema :refer :all]
            [oph.va.virkailija.handlers :refer :all]))

(defroutes* healthcheck-routes
  "Healthcheck routes"

  (GET* "/" []
        (if (and (virkailija-db/health-check)
                 (hakija-api/health-check))
          (ok {})
          (not-found)))
  (HEAD* "/" []
         (if (and (virkailija-db/health-check)
                  (hakija-api/health-check))
          (ok {})
          (not-found))))

(defroutes resource-routes
  (GET "/" []
       (resp/redirect "/avustushaku/1/"))

  ;; Finnish subcontext
  (GET "/avustushaku/:avustushaku-id/nayta" [avustushaku-id] (return-html "index.html"))
  (GET "/avustushaku/:avustushaku-id/" [avustushaku-id] (return-html "login.html"))
  (route/resources "/avustushaku/:avustushaku-id/" {:mime-types {"html" "text/html; charset=utf-8"}})

  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))

(defroutes* hakemus-routes
  "Hakemus listing and filtering"

  (GET* "/" []
        (hakija-api/list-hakemukset)))

(defroutes* doc-routes
  "API documentation browser"
  (swagger-ui))

(defn- create-swagger-docs []
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name        "hakemus"
                         :description "Hakemus listing and filtering"}
                        {:name        "healthcheck"
                         :description "Healthcheck"}]}))

(defapi all-routes
  {:formats [:json-kw]
   :exceptions {:handlers {::compojure-ex/response-validation compojure-error-handler
                           ::compojure-ex/request-parsing compojure-error-handler
                           ::compojure-ex/request-validation compojure-error-handler
                           ::compojure-ex/default exception-handler}}}

  (create-swagger-docs)

  (context* "/api/hakemus" [] :tags ["hakemus"] hakemus-routes)
  (context* "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)

  ;; Documentation
  (context* "/doc" [] doc-routes)

  ;; Resources
  resource-routes)
