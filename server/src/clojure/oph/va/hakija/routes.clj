(ns oph.va.hakija.routes
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
            [oph.soresu.common.config :refer [config-simple-name]]
            [oph.soresu.common.routes :refer :all]
            [oph.va.schema :refer :all]
            [oph.soresu.form.schema :refer :all]
            [oph.va.routes :as va-routes]
            [oph.soresu.form.routes :as soresu-routes]
            [oph.va.hakija.api.muutoshakemus :refer [muutoshakemus-routes]]
            [oph.va.hakija.db :as hakija-db]
            [oph.va.hakija.schema :refer :all]
            [oph.va.hakija.handlers :refer :all]
            [oph.va.hakija.selvitys.routes :as selvitys-routes]
            [oph.va.environment :as va-env]
            [oph.common.organisation-service :as org])
  (:import (org.postgresql.util PSQLException)))

(defn- on-healthcheck []
  (log/info "hakija healthcheck")
  (if (hakija-db/health-check)
    (ok {})
    (not-found)))

(compojure-api/defroutes healthcheck-routes
  "Healthcheck routes"

  (compojure-api/GET "/" [] (on-healthcheck))

  (compojure-api/POST "/csp-report" request
    (log/info "CSP:" (slurp (:body request)))
    (ok {:ok "ok"}))

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

(defn- get-id []
  (compojure-api/GET "/:id" [id]
    :path-params [id :- Long]
    :return AvustusHaku
    :summary "Get avustushaku description"
    (if-let [avustushaku (hakija-db/get-avustushaku id)]
      (avustushaku-ok-response avustushaku)
      (not-found))))

(defn- get-normalized-hakemus []
  (compojure-api/GET "/:haku-id/hakemus/:user-key/normalized" [haku-id user-key]
    :path-params [haku-id :- Long user-key :- s/Str]
    :return  NormalizedHakemus
    :summary "Get normalized answers"
    (if-let [hakemus (hakija-db/get-normalized-hakemus user-key)]
      (ok hakemus)
      (not-found))))

(defn- get-hakemus []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id" [haku-id hakemus-id]
    :path-params [haku-id :- Long hakemus-id :- s/Str]
    :query-params [{decision-version :- s/Bool false}]
    :return  Hakemus
    :summary "Get answers"
    (if decision-version
      (on-get-decision-answers haku-id hakemus-id :form)
      (on-get-current-answers haku-id hakemus-id :form))))

(defn- put-hakemus []
  (compojure-api/PUT "/:haku-id/hakemus" [haku-id :as request]
    :path-params [haku-id :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  Hakemus
    :summary "Create initial hakemus"
    (on-hakemus-create haku-id answers)))

(defn- put-refuse-hakemus []
  (compojure-api/PUT "/:grant-id/hakemus/:application-id/:base-version/refuse/" [grant-id application-id base-version :as request]
    :path-params
    [grant-id :- Long, application-id :- s/Str, base-version :- Long]
    :query-params [{token :- String nil}]
    :return  Hakemus
    :body [refuse-data (compojure-api/describe RefuseData "Refuse data")]
    :summary "Update application status to refused"
    (on-refuse-application application-id base-version (:comment refuse-data) token)))

(defn- post-hakemus []
  (compojure-api/POST "/:haku-id/hakemus/:hakemus-id/:base-version" [haku-id hakemus-id base-version :as request]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  Hakemus
    :summary "Update hakemus values"
    (if (can-update-hakemus haku-id hakemus-id (:identity request))
      (try
        (on-hakemus-update haku-id hakemus-id base-version answers)
        (catch PSQLException e (do (log/warn e "Could not update hakemus")
                                   (bad-request! {:error "can not update hakemus"}))))
      (bad-request! {:error "can not update hakemus"}))))

(defn- post-hakemus-submit []
  (compojure-api/POST "/:haku-id/hakemus/:user-key/:base-version/submit" [haku-id user-key base-version :as request]
    :path-params [haku-id :- Long, user-key :- s/Str, base-version :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  Hakemus
    :summary "Submit hakemus"
    (if (can-update-hakemus haku-id user-key nil)
      (on-hakemus-submit haku-id user-key base-version answers)
      (bad-request! {:error "can not update hakemus"}))))

(defn- post-change-request-response []
  (compojure-api/POST "/:haku-id/hakemus/:hakemus-id/:base-version/change-request-response" [haku-id hakemus-id base-version :as request]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  nil
    :summary "Submit response for hakemus change request"
    (if (can-update-hakemus haku-id hakemus-id nil)
      (on-hakemus-change-request-response haku-id hakemus-id base-version answers)
      (bad-request! {:error "can not update hakemus"}))))

(defn- officer-edit-submit []
  (compojure-api/POST "/:haku-id/hakemus/:user-key/:base-version/officer-edit-submit" [haku-id hakemus-id base-version :as request]
    :path-params [haku-id :- Long, user-key :- s/Str, base-version :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  nil
    :summary "Submit officer edit changes"
    (if (can-update-hakemus haku-id user-key (:identity request))
      (on-hakemus-edit-submit haku-id user-key base-version answers :officer-edit)
      (bad-request! {:error "can not update hakemus"}))))

(defn- applicant-edit-submit []
  (compojure-api/POST "/:haku-id/hakemus/:user-key/:base-version/applicant-edit-submit" [haku-id hakemus-id base-version :as request]
    :path-params [haku-id :- Long, user-key :- s/Str, base-version :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  nil
    :summary "Submit applicant edit changes"
    (if (can-update-hakemus haku-id user-key nil)
      (on-applicant-edit-submit haku-id user-key base-version answers :applicant-edit)
      (bad-request! {:error "can not update hakemus"}))))

(defn- applicant-edit-open []
  (compojure-api/POST "/:haku-id/hakemus/:hakemus-id/applicant-edit-open" [haku-id hakemus-id :as request]
    :path-params [haku-id :- Long, hakemus-id :- s/Str]
    :return  s/Num
    :summary "Open application for applicant edit"
    (ok (:version (on-hakemus-applicant-edit-open haku-id hakemus-id)))))

(defn- get-applicant-edit-open []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/applicant-edit-open"
    [haku-id hakemus-id :as request]
    :path-params [haku-id :- Long, hakemus-id :- s/Str]
    :return  nil
    :summary "Open application for applicant edit"
    (ok (on-hakemus-applicant-edit-open haku-id hakemus-id))))

(defn- get-muutoshakemukset []
  (compojure-api/GET "/:avustushaku-id/hakemus/:user-key/muutoshakemus" [user-key]
    :path-params [user-key :- s/Str]
    :return MuutoshakemusList
    :summary "Get muutoshakemukset"
    (ok (hakija-db/get-muutoshakemukset-by-user-key user-key))))

(defn- get-attachments []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/attachments" [haku-id hakemus-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str]
    :return s/Any
    :summary "List current attachments"
    (ok (on-attachment-list hakemus-id))))

(defn- get-attachment []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" [haku-id hakemus-id field-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, field-id :- s/Str]
    (on-attachment-get hakemus-id field-id)))

(defn- options-del-attachment []
  (compojure-api/OPTIONS "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" [haku-id hakemus-id field-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, field-id :- s/Str]
    (-> (ok {:status "ok"})
        (assoc-in [:headers "Access-Control-Allow-Origin"] (va-env/virkailija-url))
        (assoc-in [:headers "Access-Control-Allow-Methods"] "DELETE"))))

(defn- del-attachment []
  (compojure-api/DELETE "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" [haku-id hakemus-id field-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, field-id :- s/Str]
    :summary "Delete attachment (marks attachment as closed)"
    (let [response (on-attachment-delete hakemus-id field-id)]
      (assoc-in response [:headers "Access-Control-Allow-Origin"] (va-env/virkailija-url)))))

(defn- options-put-attachment []
  (compojure-api/OPTIONS "/:haku-id/hakemus/:hakemus-id/:hakemus-base-version/attachments/:field-id" [haku-id hakemus-id hakemus-base-version field-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, hakemus-base-version :- Long, field-id :- s/Str]
    (-> (ok {:status "ok"})
        (assoc-in [:headers "Access-Control-Allow-Origin"] (va-env/virkailija-url))
        (assoc-in [:headers "Access-Control-Allow-Methods"] "PUT"))))

(defn- put-attachment []
  (compojure-api/PUT "/:haku-id/hakemus/:hakemus-id/:hakemus-base-version/attachments/:field-id" [haku-id hakemus-id hakemus-base-version field-id]
    :path-params [haku-id :- Long, hakemus-id :- s/Str, hakemus-base-version :- Long, field-id :- s/Str]
    :multipart-params [file :- compojure-upload/TempFileUpload]
    :return Attachment
    :summary "Add new attachment. Existing attachment with same id is closed."
    (let [{:keys [filename content-type size tempfile]} file
          response (on-attachment-create hakemus-id
                                         hakemus-base-version
                                         field-id
                                         filename
                                         content-type
                                         size
                                         tempfile)]
      (assoc-in response [:headers "Access-Control-Allow-Origin"] (va-env/virkailija-url)))))

(compojure-api/defroutes applications-routes
  "API for applications"

  (compojure-api/GET
    "/:user-key/tokens/:token/validate/"
    [user-key token :as request]
    :path-params [user-key :- s/Str token :- s/Str]
    :return TokenValidity
    :summary "Checking if application token is valid"
    (ok {:valid (hakija-db/valid-user-key-token? token user-key)})))

(compojure-api/defroutes avustushaku-routes
  "Avustushaku routes"
  (get-id)
  (get-normalized-hakemus)
  (get-muutoshakemukset)
  (get-hakemus)
  (selvitys-routes/get-selvitys)
  (selvitys-routes/get-selvitys-init)
  (selvitys-routes/post-selvitys)
  (selvitys-routes/post-selvitys-submit)
  (selvitys-routes/post-loppuselvitys-change-request-response)
  (put-hakemus)
  (put-refuse-hakemus)
  (applicant-edit-open)
  (post-hakemus)
  (post-hakemus-submit)
  (post-change-request-response)
  (officer-edit-submit)
  (applicant-edit-submit)
  (get-applicant-edit-open)
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
     (if (= (config-simple-name) "dev") (resp/redirect "/avustushaku/1/")
         (if (= (:server-name request) "statsunderstod.oph.fi")
           (resp/redirect "http://www.oph.fi/finansiering/statsunderstod")
           (resp/redirect "http://oph.fi/rahoitus/valtionavustukset"))))

   ;; Finnish subcontext
   (compojure/GET "/muutoshakemus" [] (return-html "hakija/muutoshakemus.html"))
   (compojure/GET "/muutoshakemus/paatos" [] (return-html "hakija/muutoshakemus.html"))
   (compojure/GET "/avustushaku/:avustushaku-id/nayta" [avustushaku-id] (return-html "hakija/index.html"))
   (compojure/GET "/avustushaku/:avustushaku-id/loppuselvitys" [avustushaku-id] (return-html "hakija/selvitys.html"))
   (compojure/GET "/avustushaku/:avustushaku-id/valiselvitys" [avustushaku-id] (return-html "hakija/selvitys.html"))
   (compojure/GET "/avustushaku/:avustushaku-id/" [avustushaku-id] (return-html "hakija/login.html"))

   (compojure/GET "/avustushaku/:avustushaku-id/esikatselu" [avustushaku-id] (return-html "hakija/index.html"))
   (compojure/GET "/avustushaku/:avustushaku-id/loppuselvitys/esikatselu" [avustushaku-id] (return-html "hakija/selvitys.html"))
   (compojure/GET "/avustushaku/:avustushaku-id/valiselvitys/esikatselu" [avustushaku-id] (return-html "hakija/selvitys.html"))

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
   (compojure-route/resources "/muutoshakemus" {:mime-types {"html" "text/html; charset=utf-8"}})
   (compojure-route/resources "/muutoshakemus/paatos" {:mime-types {"html" "text/html; charset=utf-8"}})

   ;;; Swedish subcontext
   (compojure/GET "/statsunderstod/:avustushaku-id/visa" [avustushaku-id] (return-html "hakija/index.html"))
   (compojure/GET "/statsunderstod/:avustushaku-id/" [avustushaku-id] (return-html "hakija/login.html"))

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

  (compojure-api/context "/api/form" [] :tags ["forms"] soresu-routes/form-restricted-routes)

  (compojure-api/context "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  (compojure-api/context "/api/muutoshakemus" [] :tags ["muutoshakemukset"] muutoshakemus-routes)

  (compojure-api/context "/api/organisations" [] :tags ["organisations"] organisation-routes)

  (compojure-api/context "/api/v2/applications" [] :tags ["applications"] applications-routes)

  va-routes/config-routes
  resource-routes)

(compojure-api/defapi all-routes
  api-config

  (compojure-api/context "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)

  (compojure-api/context "/api/form" [] :tags ["forms"] soresu-routes/form-routes)

  (compojure-api/context "/api/test" [] :tags ["test"] test-routes)

  (compojure-api/context "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  (compojure-api/context "/api/organisations" [] :tags ["organisations"] organisation-routes)

  (compojure-api/context "/api/v2/applications" [] :tags ["applications"] applications-routes)

  (compojure-api/context "/api/muutoshakemus" [] :tags ["muutoshakemukset"] muutoshakemus-routes)

  va-routes/config-routes
  resource-routes)
