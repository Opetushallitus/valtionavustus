(ns ^{:skip-aot true} oph.va.hakija.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [clojure.tools.logging :as log]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :as compojure]
            [compojure.route :as compojure-route]
            [compojure.api.sweet :as compojure-api]
            [compojure.api.exception :as compojure-ex]
            [compojure.api.upload :as compojure-upload]
            [ring.swagger.json-schema-dirty]  ; for schema.core/conditional
            [schema.core :as s]
            [oph.common.datetime :as datetime]
            [oph.soresu.common.config :refer [config config-simple-name]]
            [oph.soresu.common.routes :refer :all]
            [oph.va.schema :refer :all]
            [oph.soresu.form.schema :refer :all]
            [oph.va.routes :as va-routes]
            [oph.soresu.form.routes :refer :all]
            [oph.va.hakija.db :as hakija-db]
            [oph.va.hakija.schema :refer :all]
            [oph.va.hakija.handlers :refer :all]
            [oph.common.organisation-service :as org]))

(defn- on-healthcheck []
  (if (hakija-db/health-check)
    (ok {})
    (not-found)))

(compojure-api/defroutes healthcheck-routes
  "Healthcheck routes"

  (compojure-api/GET "/" [] (on-healthcheck))

  (compojure-api/HEAD "/" [] (on-healthcheck)))

(defn- system-time-ok-response [datetime]
  (ok {:system-time (.toDate datetime)}))

(compojure-api/defroutes test-routes
  "Routes for testing"

  (compojure-api/GET "/system-time" []
    :return SystemTime
    (system-time-ok-response (datetime/now)))

  (compojure-api/PUT "/system-time" []
    :body [time (compojure-api/describe SystemTime "New system time")]
    :return SystemTime
    (system-time-ok-response (datetime/set-time (:system-time time))))

  (compojure-api/DELETE "/system-time" []
    :return SystemTime
    (datetime/reset-time)
    (system-time-ok-response (datetime/now))))

(defn- avustushaku-ok-response [avustushaku]
  (ok (va-routes/avustushaku-response-content avustushaku)))

(defn- selvitys-form-keyword [selvitys-type]
  (let [key (str "form_" selvitys-type)]
    (keyword key))
)

(defn- get-id []
  (compojure-api/GET "/:id" [id]
    :path-params [id :- Long]
    :return AvustusHaku
    :summary "Get avustushaku description"
    (if-let [avustushaku (hakija-db/get-avustushaku id)]
      (avustushaku-ok-response avustushaku)
      (not-found))))

(defn- get-hakemus []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id" [haku-id hakemus-id]
    :path-params [haku-id :- Long hakemus-id :- s/Str]
    :return  Hakemus
    :summary "Get current answers"
    (on-get-current-answers haku-id hakemus-id :form)))

(defn- get-selvitys []
  (compojure-api/GET "/:haku-id/selvitys/:selvitys-type/:hakemus-id" [haku-id hakemus-id selvitys-type]
    :path-params [haku-id :- Long, hakemus-id :- s/Str selvitys-type :- s/Str]
    :return  Hakemus
    :summary "Get current answers"
    (on-get-current-answers haku-id hakemus-id (selvitys-form-keyword selvitys-type))))

(defn- get-selvitys-init []
  (compojure-api/GET "/:haku-id/selvitys/:selvitys-type/init/:hakemus-id" [haku-id selvitys-type hakemus-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str selvitys-type :- s/Str]
    :return HakemusInfo
    :summary "Get or create selvitys for hakemus"
    (on-selvitys-init haku-id hakemus-id selvitys-type)))

(defn- post-selvitys []
  (compojure-api/POST "/:haku-id/selvitys/:selvitys-type/:hakemus-id/:base-version" [haku-id hakemus-id base-version selvitys-type :as request]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
    :body [answers (compojure-api/describe Answers "New answers")]
    :return Hakemus
    :summary "Update hakemus values"
    (on-selvitys-update haku-id hakemus-id base-version answers (selvitys-form-keyword selvitys-type))))

(defn- post-selvitys-submit []
  (compojure-api/POST "/:haku-id/selvitys/:selvitys-type/:hakemus-id/:base-version/submit" [haku-id selvitys-type hakemus-id base-version :as request]
    :path-params [haku-id :- Long, selvitys-type :- s/Str, hakemus-id :- s/Str, base-version :- Long]
    :body [answers (compojure-api/describe Answers "New answers")]
    :return Hakemus
    :summary "Submit hakemus"
    (on-selvitys-submit haku-id hakemus-id base-version answers (selvitys-form-keyword selvitys-type) selvitys-type)))

(defn- put-hakemus []
  (compojure-api/PUT "/:haku-id/hakemus" [haku-id :as request]
    :path-params [haku-id :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  Hakemus
    :summary "Create initial hakemus"
    (on-hakemus-create haku-id answers)))

(defn- post-hakemus []
  (compojure-api/POST "/:haku-id/hakemus/:hakemus-id/:base-version" [haku-id hakemus-id base-version :as request]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  Hakemus
    :summary "Update hakemus values"
    (on-hakemus-update haku-id hakemus-id base-version answers)))

(defn- post-hakemus-submit []
  (compojure-api/POST "/:haku-id/hakemus/:hakemus-id/:base-version/submit" [haku-id hakemus-id base-version :as request]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  Hakemus
    :summary "Submit hakemus"
    (on-hakemus-submit haku-id hakemus-id base-version answers)))

(defn- post-change-request-response []
  (compojure-api/POST "/:haku-id/hakemus/:hakemus-id/:base-version/change-request-response" [haku-id hakemus-id base-version :as request]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  nil
    :summary "Submit response for hakemus change request"
    (on-hakemus-change-request-response haku-id hakemus-id base-version answers)))

(defn- officer-edit-submit []
  (compojure-api/POST "/:haku-id/hakemus/:hakemus-id/:base-version/officer-edit-submit" [haku-id hakemus-id base-version :as request]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  nil
    :summary "Submit officer edit changes"
    (on-hakemus-officer-edit-submit haku-id hakemus-id base-version answers)))

(defn- get-attachments []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/attachments" [haku-id hakemus-id ]
    :path-params [haku-id :- Long, hakemus-id :- s/Str]
    :return s/Any
    :summary "List current attachments"
    (ok (on-attachment-list haku-id hakemus-id))))

(defn- get-attachment []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" [haku-id hakemus-id field-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, field-id :- s/Str]
    (on-attachment-get haku-id hakemus-id field-id)))

(defn- options-del-attachment []
  (compojure-api/OPTIONS "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" [haku-id hakemus-id field-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, field-id :- s/Str]
    (-> (ok {:status "ok"})
        (assoc-in [:headers "Access-Control-Allow-Origin"] (va-routes/virkailija-url))
        (assoc-in [:headers "Access-Control-Allow-Methods"] "DELETE"))))

(defn- del-attachment []
  (compojure-api/DELETE "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" [haku-id hakemus-id field-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, field-id :- s/Str]
    :summary "Delete attachment (marks attachment as closed)"
    (let [response (on-attachment-delete haku-id hakemus-id field-id)]
      (assoc-in response [:headers "Access-Control-Allow-Origin"] (va-routes/virkailija-url)))))

(defn- options-put-attachment []
  (compojure-api/OPTIONS "/:haku-id/hakemus/:hakemus-id/:hakemus-base-version/attachments/:field-id" [haku-id hakemus-id hakemus-base-version field-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, hakemus-base-version :- Long, field-id :- s/Str]
    (-> (ok {:status "ok"})
        (assoc-in [:headers "Access-Control-Allow-Origin"] (va-routes/virkailija-url))
        (assoc-in [:headers "Access-Control-Allow-Methods"] "PUT"))))

(defn- put-attachment []
  (compojure-api/PUT "/:haku-id/hakemus/:hakemus-id/:hakemus-base-version/attachments/:field-id" [haku-id hakemus-id hakemus-base-version field-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, hakemus-base-version :- Long, field-id :- s/Str]
    :multipart-params [file :- compojure-upload/TempFileUpload]
    :return Attachment
    :summary "Add new attachment. Existing attachment with same id is closed."
    (let [{:keys [filename content-type size tempfile]} file
          response (on-attachment-create haku-id
                                         hakemus-id
                                         hakemus-base-version
                                         field-id
                                         filename
                                         content-type
                                         size
                                         tempfile)]
      (assoc-in response [:headers "Access-Control-Allow-Origin"] (va-routes/virkailija-url)))))

(compojure-api/defroutes avustushaku-routes
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
  (get-attachment)
  (options-del-attachment)
  (del-attachment)
  (options-put-attachment)
  (put-attachment))

(defn log-paatos-display [user-key headers remote-addr]
  (let [hakemus (hakija-db/get-hakemus user-key)]
    (if-let [hakemus-id (:id hakemus)]
      (hakija-db/add-paatos-view hakemus-id headers remote-addr))))

(compojure-api/defroutes resource-routes
  (compojure-api/undocumented
   (compojure/GET "/" request
     (if (= (:name (va-routes/environment-content)) "dev") (resp/redirect "/avustushaku/1/")
         (if (= (:server-name request) "statsunderstod.oph.fi")
           (resp/redirect "http://www.oph.fi/finansiering/statsunderstod")
           (resp/redirect "http://oph.fi/rahoitus/valtionavustukset"))))

   ;; Finnish subcontext
   (compojure/GET "/avustushaku/:avustushaku-id/nayta" [avustushaku-id] (return-html "index.html"))
   (compojure/GET "/avustushaku/:avustushaku-id/loppuselvitys" [avustushaku-id] (return-html "selvitys.html"))
   (compojure/GET "/avustushaku/:avustushaku-id/valiselvitys" [avustushaku-id] (return-html "selvitys.html"))
   (compojure/GET "/avustushaku/:avustushaku-id/" [avustushaku-id] (return-html "login.html"))

   (compojure-api/GET "/paatos/avustushaku/:avustushaku-id/hakemus/:user-key" [avustushaku-id user-key :as request]
     :path-params [avustushaku-id :- Long user-key :- s/Str]
     :query-params [{nolog :- s/Str nil}]
     (if (nil? nolog) (log-paatos-display user-key (:headers request) (:remote-addr request)))
     (let [hakemus (hakija-db/get-hakemus user-key)
           hakemus-id (:id hakemus)
           hakemus-paatos (hakija-db/get-hakemus-paatos hakemus-id)
           decision (:decision hakemus-paatos)]
       {:status 200
        :headers {"Content-Type" "text/html"}
        :body decision}))

   (compojure-route/resources "/avustushaku/:avustushaku-id/" {:mime-types {"html" "text/html; charset=utf-8"}})

   ;;; Swedish subcontext
   (compojure/GET "/statsunderstod/:avustushaku-id/visa" [avustushaku-id] (return-html "index.html"))
   (compojure/GET "/statsunderstod/:avustushaku-id/" [avustushaku-id] (return-html "login.html"))

   va-routes/logo-route

   (compojure-route/resources "/statsunderstod/:avustushaku-id/" {:mime-types {"html" "text/html; charset=utf-8"}})
   (compojure-route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
   (compojure-route/not-found "<p>Page not found.</p>")))

(compojure-api/defroutes organisation-routes
  "API for fetching organisational data with businessId"

  (compojure-api/GET "/" []
    :query-params [organisation-id :- FinnishBusinessId {lang :- s/Keyword :fi}]
    (let [organisation-info (org/get-compact-translated-info organisation-id lang)]
      (if organisation-info
        (ok organisation-info)
        (not-found)))))

(def api-config
  {:formats [:json-kw]
   :exceptions {:handlers {::compojure-ex/response-validation compojure-error-handler
                           ::compojure-ex/request-parsing compojure-error-handler
                           ::compojure-ex/request-validation compojure-error-handler
                           ::compojure-ex/default exception-handler}}
   :swagger {:ui "/doc"
             :spec "/swagger.json"
             :data {:info {:title "Valtionavustus API"}
                    :tags [{:name        "forms"
                            :description "Form and form submission management"}
                           {:name        "avustushaut"
                            :description "Avustushaku"}
                           {:name        "healthcheck"
                            :description "Healthcheck"}]}}})

(compojure-api/defapi restricted-routes
  api-config

  (compojure-api/context "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)

  (compojure-api/context "/api/form" [] :tags ["forms"] form-restricted-routes)

  (compojure-api/context "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  (compojure-api/context "/api/organisations" [] organisation-routes)

  va-routes/config-routes
  resource-routes)

(compojure-api/defapi all-routes
  api-config

  (compojure-api/context "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)

  (compojure-api/context "/api/form" [] :tags ["forms"] form-routes)

  (compojure-api/context "/api/test" [] :tags ["test"] test-routes)

  (compojure-api/context "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  (compojure-api/context "/api/organisations" [] organisation-routes)

  va-routes/config-routes
  resource-routes)
