(ns ^{:skip-aot true} oph.va.virkailija.routes
    (:use [clojure.tools.trace :only [trace]]
          [clojure.pprint :only [pprint]])
  (:require [compojure.route :as route]
            [clojure.tools.logging :as log]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [defroutes GET POST]]
            [compojure.api.sweet :refer :all]
            [compojure.api.exception :as compojure-ex]
            [schema.core :as s]
            [oph.common.config :refer [config config-simple-name]]
            [oph.common.routes :refer :all]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.auth :as auth]
            [oph.va.virkailija.schema :refer :all]
            [oph.va.virkailija.handlers :refer :all]))

(defn- on-healthcheck []
  (if (and (virkailija-db/health-check)
           (hakija-api/health-check))
    (ok {})
    (not-found)))

(defn- on-hakemus-preview [avustushaku-id hakemus-user-key]
  (let [hakija-app-url (-> config :server :url :fi)
        preview-url (str hakija-app-url "avustushaku/" avustushaku-id "/nayta?hakemus=" hakemus-user-key "&preview=true")]
    (resp/redirect preview-url ))
)

(defroutes* healthcheck-routes
  "Healthcheck routes"

  (GET* "/" [] (on-healthcheck))
  (HEAD* "/" [] (on-healthcheck)))

(defroutes resource-routes
  (GET "/" [] (return-html "index.html"))
  (GET* "/hakemus-preview/:avustushaku-id/:hakemus-user-key" []
    :path-params [avustushaku-id :- Long, hakemus-user-key :- s/Str]
    (on-hakemus-preview avustushaku-id hakemus-user-key))

  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))

;; TODO: use form definition
(s/defschema Answer {:key s/Str
                     :value (s/either s/Str
                                      s/Int
                                      [(s/recursive #'Answer)])})

;; TODO: use submission definition for status
(s/defschema Hakemus {:id s/Int
                      :project-name s/Str
                      :organization-name s/Str
                      :status (s/enum "new" "draft" "submitted")
                      :budget-total s/Int
                      :budget-oph-share s/Int
                      :user-key s/Str
                      :answers [Answer]})

(s/defschema Role {:id s/Int
                   :name s/Str
                   :email s/Str
                   :role (s/enum "presenting_officer"
                                 "evaluator")})

(s/defschema Avustushaku
  "Avustushaku structured response"
  {:avustushaku {:id s/Int
                 :name {:fi s/Str
                        :sv s/Str}
                 :self-financing-percentage s/Int}
   :roles [Role]
   :hakemukset [Hakemus]})

(defroutes* avustushaku-routes
  "Hakemus listing and filtering"

  (GET* "/:avustushaku-id" [avustushaku-id]
        :path-params [avustushaku-id :- Long]
        :return Avustushaku
        (if-let [response (hakija-api/get-avustushaku avustushaku-id)]
          (ok response)
          (not-found))))

(defroutes* login-routes
  "Authentication"

  (GET "/" [] (return-html "login.html"))
  (POST* "/" [username password]
        :form-params [username :- s/Str password :- s/Str]
        :return s/Any
        (if (auth/authenticate username password)
          (resp/redirect "/")
          (forbidden "Invalid credentials"))))

(defroutes* doc-routes
  "API documentation browser"
  (swagger-ui))

(defn- create-swagger-docs []
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name        "avustushaku"
                         :description "Avustushaku and hakemus listing and filtering"}
                        {:name        "healthcheck"
                         :description "Healthcheck"}]}))

(defapi all-routes
  {:formats [:json-kw]
   :exceptions {:handlers {::compojure-ex/response-validation compojure-error-handler
                           ::compojure-ex/request-parsing compojure-error-handler
                           ::compojure-ex/request-validation compojure-error-handler
                           ::compojure-ex/default exception-handler}}}

  (create-swagger-docs)

  (context* "/api/avustushaku" [] :tags ["avustushaku"] avustushaku-routes)
  (context* "/login" [] :tags ["login"] login-routes)
  (context* "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)

  ;; Documentation
  (context* "/doc" [] doc-routes)

  ;; Resources
  resource-routes)
