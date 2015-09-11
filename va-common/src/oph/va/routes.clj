(ns oph.va.routes
  (:require [oph.common.config :refer :all]
            [oph.common.routes :refer :all]
            [ring.util.http-response :refer :all]
            [compojure.core :refer [defroutes GET POST]]
            [compojure.api.sweet :refer :all]
            [oph.va.schema :refer :all]))

(defn environment-content []
  {:name      (config-simple-name)
   :show-name (:show-environment? (:ui config))})

(defn get-translations []
  (return-from-classpath "translations.json" "application/json"))

(defroutes config-routes
   (GET* "/environment" []
         :return Environment
         (ok (environment-content)))
   (GET "/translations.json" [] (get-translations)))

(defn avustushaku-response-content [avustushaku]
  {:id          (:id avustushaku)
   :content     (:content avustushaku)
   :form        (:form avustushaku)})