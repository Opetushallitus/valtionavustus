(ns ^{:skip-aot true} oph.va.hakija.routes
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
            [oph.form.routes :refer :all]
            [oph.form.schema :refer :all]
            [oph.va.hakija.db :as hakija-db]
            [oph.va.hakija.schema :refer :all]
            [oph.va.hakija.handlers :refer :all]))

(create-form-schema [:vaBudget
                     :vaSummingBudgetElement
                     :vaBudgetItemElement
                     :vaBudgetSummaryElement
                     :vaProjectDescription])

(defroutes* healthcheck-routes
  "Healthcheck routes"

  (GET* "/" []
        (if (hakija-db/health-check)
          (ok {})
          (not-found)))
  (HEAD* "/" []
        (if (hakija-db/health-check)
          (ok {})
          (not-found))))

(defn avustushaku-ok-response [avustushaku]
  (ok {:id (:id avustushaku)
       :content (:content avustushaku)
       :form (:form avustushaku)
       :environment {:name (config-simple-name)
                     :show-name (:show-environment? (:ui config))}}))

(defroutes* avustushaku-routes
  "Avustushaku routes"

  (GET* "/:id" [id]
        :path-params [id :- Long]
        :return AvustusHaku
        (if-let [avustushaku (hakija-db/get-avustushaku id)]
          (avustushaku-ok-response avustushaku)
          (not-found)))

  (GET* "/:haku-id/hakemus/:hakemus-id" [haku-id hakemus-id]
        :path-params [haku-id :- Long, hakemus-id :- s/Str]
        :return  Hakemus
        :summary "Get current answers"
        (on-get-current-answers haku-id hakemus-id))

  (PUT* "/:haku-id/hakemus" [haku-id :as request]
      :path-params [haku-id :- Long]
      :body    [answers (describe Answers "New answers")]
      :return  Hakemus
      :summary "Create initial hakemus"
      (on-hakemus-create haku-id answers))

  (POST* "/:haku-id/hakemus/:hakemus-id/:base-version" [haku-id hakemus-id base-version :as request]
       :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
       :body    [answers (describe Answers "New answers")]
       :return  Hakemus
       :summary "Update hakemus values"
       (on-hakemus-update haku-id hakemus-id base-version answers))

  (POST* "/:haku-id/hakemus/:hakemus-id/:base-version/submit" [haku-id hakemus-id base-version :as request]
       :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
       :body    [answers (describe Answers "New answers")]
       :return  Hakemus
       :summary "Submit hakemus"
       (on-hakemus-submit haku-id hakemus-id base-version answers)))

(defroutes resource-routes
  (GET "/" []
       (resp/redirect "/avustushaku/1/"))

  ;; Finnish subcontext
  (GET "/avustushaku/:avustushaku-id/nayta" [avustushaku-id] (return-html "index.html"))
  (GET "/avustushaku/:avustushaku-id/" [avustushaku-id] (return-html "login.html"))
  (route/resources "/avustushaku/:avustushaku-id/" {:mime-types {"html" "text/html; charset=utf-8"}})

  ;; Swedish subcontext
  (GET "/statsunderstod/:avustushaku-id/visa" [avustushaku-id] (return-html "index.html"))
  (GET "/statsunderstod/:avustushaku-id/" [avustushaku-id] (return-html "login.html"))
  (route/resources "/statsunderstod/:avustushaku-id/" {:mime-types {"html" "text/html; charset=utf-8"}})

  (GET "/translations.json" [] (return-from-classpath "public/translations.json"))
  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))

(defroutes* doc-routes
  "API documentation browser"
  (swagger-ui))

(defn- create-swagger-docs []
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name        "forms"
                         :description "Form and form submission management"}
                        {:name        "avustushaut"
                         :description "Avustushaku"}
                        {:name        "healthcheck"
                         :description "Healthcheck"}]}))

(defapi restricted-routes
  {:formats [:json-kw]
   :exceptions {:handlers {::compojure-ex/response-validation compojure-error-handler
                           ::compojure-ex/request-parsing compojure-error-handler
                           ::compojure-ex/request-validation compojure-error-handler
                           ::compojure-ex/default exception-handler}}}

  (create-swagger-docs)

  (context* "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)
  (context* "/api/form" [] :tags ["forms"] form-restricted-routes)
  (context* "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  (context* "/doc" [] doc-routes)

  ;; Resources
  resource-routes)

(defapi all-routes
  {:formats [:json-kw]
   :exceptions {:handlers {::compojure-ex/response-validation compojure-error-handler
                           ::compojure-ex/request-parsing compojure-error-handler
                           ::compojure-ex/request-validation compojure-error-handler
                           ::compojure-ex/default exception-handler}}}

  (create-swagger-docs)

  (context* "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)
  (context* "/api/form" [] :tags ["forms"] form-routes)
  (context* "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  ;; Documentation
  (context* "/doc" [] doc-routes)

  ;; Resources
  resource-routes)
