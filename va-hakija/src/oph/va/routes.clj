(ns ^{:skip-aot true} oph.va.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [compojure.route :as route]
            [clojure.tools.logging :as log]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [defroutes GET]]
            [compojure.api.sweet :refer :all]
            [ring.swagger.middleware :as swagger]
            [schema.core :as s]
            [oph.common.config :refer [config config-simple-name]]
            [oph.form.routes :refer :all]
            [oph.form.schema :refer :all]
            [oph.va.db :as va-db]
            [oph.va.schema :refer :all]
            [oph.va.handlers :refer :all]))

(create-form-schema [:vaBudget
                     :vaSummingBudgetElement
                     :vaBudgetItemElement
                     :vaBudgetSummaryElement
                     :vaProjectDescription])

(defroutes* healthcheck-routes
  "Healthcheck routes"

  (GET* "/" []
        (if (va-db/health-check)
          (ok {})
          (not-found)))
  (HEAD* "/" []
        (if (va-db/health-check)
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
        (if-let [avustushaku (va-db/get-avustushaku id)]
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

(defn return-html [filename]
  (-> (resp/resource-response filename {:root "public"})
      (content-type "text/html")
      (charset  "utf-8")))

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

  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))

(defroutes* doc-routes
  "API documentation browser"
  (swagger-ui))

(defn- exception-handler [^Exception e]
  (log/warn e e)
  (internal-server-error {:type "unknown-exception"
                          :class (.getName (.getClass e))}))

(defn- validation-error-handler [{:keys [error]}]
  (let [error-str (swagger/stringify-error error)]
    (log/warn (format "Request validation error: %s" (print-str error-str)))
    (bad-request {:errors error-str})))

(defapi restricted-routes
  {:formats [:json-kw]
   :validation-errors {:error-handler validation-error-handler
                       :catch-core-errors? false}
   :exceptions {:exception-handler exception-handler}}

  ;; swagger.json generation
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name "forms"
                         :description "Form and form submission management"}
                        {:name "avustushaut"
                         :description "Avustushaku"}
                        {:name "healthcheck"
                         :description "Healthcheck"}]})

  (context* "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)
  (context* "/api/form" [] :tags ["forms"] form-restricted-routes)
  (context* "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  (context* "/doc" [] doc-routes)

  ;; Resources
  resource-routes)

(defapi all-routes
  {:formats [:json-kw]
   :validation-errors {:error-handler validation-error-handler
                       :catch-core-errors? false}
   :exceptions {:exception-handler exception-handler}}

  ;; swagger.json generation
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name "forms"
                         :description "Form and form submission management"}
                        {:name "avustushaut"
                         :description "Avustushaku"}
                        {:name "healthcheck"
                         :description "Healthcheck"}]})

  (context* "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)
  (context* "/api/form" [] :tags ["forms"] form-routes)
  (context* "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  ;; Documentation
  (context* "/doc" [] doc-routes)

  ;; Resources
  resource-routes)
