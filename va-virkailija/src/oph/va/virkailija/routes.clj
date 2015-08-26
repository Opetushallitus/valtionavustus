(ns ^{:skip-aot true} oph.va.virkailija.routes
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
            [oph.va.virkailija.db :as va-db]
            [oph.va.virkailija.schema :refer :all]
            [oph.va.virkailija.handlers :refer :all]))

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

(defn- create-swagger-docs []
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name        "forms"
                         :description "Form and form submission management"}
                        {:name        "avustushaut"
                         :description "Avustushaku"}
                        {:name        "healthcheck"
                         :description "Healthcheck"}]}))

(defapi all-routes
  {:formats [:json-kw]
   :validation-errors {:error-handler validation-error-handler
                       :catch-core-errors? false}
   :exceptions {:exception-handler exception-handler}}

  (create-swagger-docs)

  (context* "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)

  ;; Documentation
  (context* "/doc" [] doc-routes)

  ;; Resources
  resource-routes)
