(ns ^{:skip-aot true} oph.va.hakija.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [compojure.route :as route]
            [clojure.tools.logging :as log]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [defroutes GET]]
            [compojure.api.sweet :refer :all]
            [compojure.api.exception :as compojure-ex]
            [compojure.api.upload :as upload]
            [schema.core :as s]
            [oph.common.datetime :as datetime]
            [oph.soresu.common.config :refer [config config-simple-name]]
            [oph.soresu.common.routes :refer :all]
            [oph.va.schema :refer :all]
            [oph.soresu.form.schema :refer :all]
            [oph.va.routes :refer :all]
            [oph.soresu.form.routes :refer :all]
            [oph.va.hakija.db :as hakija-db]
            [oph.va.hakija.schema :refer :all]
            [oph.va.hakija.handlers :refer :all]))

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

(defn- system-time-ok-response [datetime]
  (ok {:system-time (.toDate datetime)}))

(defroutes* test-routes
  "Routes for testing"

  (GET* "/system-time" []
        :return SystemTime
        (system-time-ok-response (datetime/now)))

  (PUT* "/system-time" []
        :body [time (describe SystemTime "New system time")]
        :return SystemTime
        (system-time-ok-response (datetime/set-time (:system-time time))))

  (DELETE* "/system-time" []
           :return SystemTime
           (datetime/reset-time)
           (system-time-ok-response (datetime/now))))

(defn- avustushaku-ok-response [avustushaku]
  (ok (avustushaku-response-content avustushaku)))

(defn- selvitys-form-keyword [selvitys-type]
  (let [key (str "form_" selvitys-type)]
    (keyword key))
)

(defn- get-id []
  (GET* "/:id" [id]
        :path-params [id :- Long]
        :return AvustusHaku
        :summary "Get avustushaku description"
        (if-let [avustushaku (hakija-db/get-avustushaku id)]
          (avustushaku-ok-response avustushaku)
          (not-found))))

(defn- get-hakemus []
  (GET* "/:haku-id/hakemus/:hakemus-id" [haku-id hakemus-id]
        :path-params [haku-id :- Long hakemus-id :- s/Str]
        :return  Hakemus
        :summary "Get current answers"
        (on-get-current-answers haku-id hakemus-id :form)))

(defn- get-selvitys []
  (GET* "/:haku-id/selvitys/:selvitys-type/:hakemus-id" [haku-id hakemus-id selvitys-type]
        :path-params [haku-id :- Long, hakemus-id :- s/Str selvitys-type :- s/Str]
        :return  Hakemus
        :summary "Get current answers"
        (on-get-current-answers haku-id hakemus-id (selvitys-form-keyword selvitys-type))))

(defn- get-selvitys-init []
  (GET* "/:haku-id/selvitys/:selvitys-type/init/:hakemus-id" [haku-id selvitys-type hakemus-id]
        :path-params [haku-id :- Long, hakemus-id :- s/Str selvitys-type :- s/Str]
        :return HakemusInfo
        :summary "Get or create selvitys for hakemus"
        (on-selvitys-init haku-id hakemus-id selvitys-type)))

(defn- post-selvitys []
  (POST* "/:haku-id/selvitys/:selvitys-type/:hakemus-id/:base-version" [haku-id hakemus-id base-version selvitys-type :as request]
         :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
         :body [answers (describe Answers "New answers")]
         :return Hakemus
         :summary "Update hakemus values"
         (on-selvitys-update haku-id hakemus-id base-version answers (selvitys-form-keyword selvitys-type))))

(defn- post-selvitys-submit []
  (POST* "/:haku-id/selvitys/:selvitys-type/:hakemus-id/:base-version/submit" [haku-id selvitys-type hakemus-id base-version :as request]
         :path-params [haku-id :- Long, selvitys-type :- s/Str, hakemus-id :- s/Str, base-version :- Long]
         :body [answers (describe Answers "New answers")]
         :return Hakemus
         :summary "Submit hakemus"
         (on-selvitys-submit haku-id hakemus-id base-version answers (selvitys-form-keyword selvitys-type) selvitys-type)))

(defn- put-hakemus []
  (PUT* "/:haku-id/hakemus" [haku-id :as request]
        :path-params [haku-id :- Long]
        :body    [answers (describe Answers "New answers")]
        :return  Hakemus
        :summary "Create initial hakemus"
        (on-hakemus-create haku-id answers)))

(defn- post-hakemus []
  (POST* "/:haku-id/hakemus/:hakemus-id/:base-version" [haku-id hakemus-id base-version :as request]
         :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
         :body    [answers (describe Answers "New answers")]
         :return  Hakemus
         :summary "Update hakemus values"
         (on-hakemus-update haku-id hakemus-id base-version answers)))

(defn- post-hakemus-submit []
  (POST* "/:haku-id/hakemus/:hakemus-id/:base-version/submit" [haku-id hakemus-id base-version :as request]
         :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
         :body    [answers (describe Answers "New answers")]
         :return  Hakemus
         :summary "Submit hakemus"
         (on-hakemus-submit haku-id hakemus-id base-version answers)))

(defn- post-change-request-response []
  (POST* "/:haku-id/hakemus/:hakemus-id/:base-version/change-request-response" [haku-id hakemus-id base-version :as request]
         :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
         :body    [answers (describe Answers "New answers")]
         :return  nil
         :summary "Submit response for hakemus change request"
         (on-hakemus-change-request-response haku-id hakemus-id base-version answers)))

(defn- officer-edit-submit []
  (POST* "/:haku-id/hakemus/:hakemus-id/:base-version/officer-edit-submit" [haku-id hakemus-id base-version :as request]
         :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
         :body    [answers (describe Answers "New answers")]
         :return  nil
         :summary "Submit officer edit changes"
         (on-hakemus-officer-edit-submit haku-id hakemus-id base-version answers)))

(defn- get-attachments []
  (GET* "/:haku-id/hakemus/:hakemus-id/attachments" [haku-id hakemus-id ]
        :path-params [haku-id :- Long, hakemus-id :- s/Str]
        :return s/Any
        :summary "List current attachments"
        (ok (on-attachment-list haku-id hakemus-id))))


(defn- options-del-attachment []
  (OPTIONS* "/:haku-id/hakemus/:hakemus-id/attachments/:field-id"
            [haku-id hakemus-id field-id]
            :path-params [haku-id :- Long, hakemus-id :- s/Str, field-id :- s/Str]
            (-> (ok {:status "ok"} ) (assoc-in [:headers "Access-Control-Allow-Origin"] (virkailija-url)) (assoc-in [:headers "Access-Control-Allow-Methods"] "DELETE"))))

(defn- del-attachment []
  (DELETE* "/:haku-id/hakemus/:hakemus-id/attachments/:field-id"
           [haku-id hakemus-id field-id]
           :path-params [haku-id :- Long, hakemus-id :- s/Str, field-id :- s/Str]
           :summary "Delete attachment (marks attachment as closed)"
           (on-attachment-delete haku-id
                                 hakemus-id
                                 field-id (virkailija-url))))

(defn- put-attachment []
  (PUT* "/:haku-id/hakemus/:hakemus-id/:hakemus-base-version/attachments/:field-id"
        [haku-id hakemus-id hakemus-base-version field-id]
        :path-params [haku-id :- Long, hakemus-id :- s/Str, hakemus-base-version :- Long, field-id :- s/Str]
        :multipart-params [file :- upload/TempFileUpload]
        :return Attachment
        :summary "Add new attachment. Existing attachment with same id is closed."
        (let [{:keys [filename content-type size tempfile]} file]
          (on-attachment-create haku-id
                                hakemus-id
                                hakemus-base-version
                                field-id
                                filename
                                content-type
                                size
                                tempfile
                                (virkailija-url)))))

(defn- options-attachment []
  (OPTIONS* "/:haku-id/hakemus/:hakemus-id/:hakemus-base-version/attachments/:field-id"
         [haku-id hakemus-id hakemus-base-version field-id]
         :path-params [haku-id :- Long, hakemus-id :- s/Str, hakemus-base-version :- Long, field-id :- s/Str]
           (-> (ok {:status "ok"} ) (assoc-in [:headers "Access-Control-Allow-Origin"] (virkailija-url)) (assoc-in [:headers "Access-Control-Allow-Methods"] "PUT"))))


(defn- get-attachment []
  (GET* "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" [haku-id hakemus-id field-id]
        :path-params [haku-id :- Long, hakemus-id :- s/Str, field-id :- s/Str]
        (on-attachment-get haku-id hakemus-id field-id)))

(defroutes* avustushaku-routes
  "Avustushaku routes"
            (get-id)
            (get-hakemus)
            (get-selvitys)
            (get-selvitys-init)
            (post-selvitys)
            (post-selvitys-submit)
            (put-hakemus)
            (post-hakemus)
            (post-hakemus-submit)
            (post-change-request-response)
            (officer-edit-submit)
            (get-attachments)
            (options-del-attachment)
            (del-attachment)
            (put-attachment)
            (options-attachment)
            (get-attachment))

(defn log-paatos-display [user-key headers remote-addr]
  (let [hakemus (hakija-db/get-hakemus user-key)]
    (if-let [hakemus-id (:id hakemus)]
      (hakija-db/add-paatos-view hakemus-id headers remote-addr))))

(defroutes resource-routes
  (GET "/" request
    (if (= (:name (environment-content)) "dev") (resp/redirect "/avustushaku/1/")
    (if (= (:server-name request) "statsunderstod.oph.fi")
      (resp/redirect "http://www.oph.fi/finansiering/statsunderstod")
      (resp/redirect "http://oph.fi/rahoitus/valtionavustukset"))))

  ;; Finnish subcontext
  (GET "/avustushaku/:avustushaku-id/nayta" [avustushaku-id] (return-html "index.html"))
  (GET "/avustushaku/:avustushaku-id/loppuselvitys" [avustushaku-id] (return-html "selvitys.html"))
  (GET "/avustushaku/:avustushaku-id/valiselvitys" [avustushaku-id] (return-html "selvitys.html"))
  (GET "/avustushaku/:avustushaku-id/" [avustushaku-id] (return-html "login.html"))

  (GET* "/paatos/avustushaku/:avustushaku-id/hakemus/:user-key" [avustushaku-id user-key :as request]
       :path-params [avustushaku-id :- Long user-key :- s/Str]
       :query-params [{nolog :- s/Str nil}]
       (if (nil? nolog) (log-paatos-display user-key (:headers request) (:remote-addr request)))
       (let [hakemus (hakija-db/get-hakemus user-key)
             hakemus-id (:id hakemus)
             hakemus-paatos (hakija-db/get-hakemus-paatos hakemus-id)
             decision (:decision hakemus-paatos)]
         {:status 200
          :headers {"Content-Type" "text/html"}
          :body decision}
         )
       )

  (route/resources "/avustushaku/:avustushaku-id/" {:mime-types {"html" "text/html; charset=utf-8"}})

  ;; Swedish subcontext
  (GET "/statsunderstod/:avustushaku-id/visa" [avustushaku-id] (return-html "index.html"))
  (GET "/statsunderstod/:avustushaku-id/" [avustushaku-id] (return-html "login.html"))
  (route/resources "/statsunderstod/:avustushaku-id/" {:mime-types {"html" "text/html; charset=utf-8"}})

  (make-permanent-logo-route)

  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))

(defroutes* organisation-routes
  "API for fetching organisational data with businessId"
  (GET "/" [organisationId]
    :query-params [organisationId]
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body {:name "Nakkila"
            :email "test@test.com"
            :address "PL1 000 Nakkila"
            :businessId organisationId}}))

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
  config-routes
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
  (context* "/api/test" [] :tags ["test"] test-routes)
  (context* "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  ;; Documentation
  (context* "/doc" [] doc-routes)

;;Api for businessId search (y-tunnus)
  (context* "/api/organisations" [] organisation-routes)
  ;; Resources
  config-routes
  resource-routes)
