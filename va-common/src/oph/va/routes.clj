(ns oph.va.routes
  (:require [oph.common.config :refer :all]
            [oph.common.routes :refer :all]
            [ring.util.http-response :refer :all]
            [compojure.core :refer [defroutes GET POST]]
            [compojure.api.sweet :refer :all]
            [clj-time.core :as t]
            [oph.common.datetime :as datetime]
            [oph.va.schema :refer :all]))

(defn environment-content []
  {:name      (config-simple-name)
   :show-name (:show-environment? (:ui config))
   :hakija-server {:url (:url (:server config))}})

(defn get-translations []
  (return-from-classpath "translations.json" "application/json"))

(defroutes config-routes
   (GET* "/environment" []
         :return Environment
         (ok (environment-content)))
   (GET "/translations.json" [] (get-translations)))

(defmulti avustushaku-phase (fn [avustushaku] [(:status avustushaku)
                                               (t/after? (datetime/now) (datetime/parse (:start (:duration (:content avustushaku)))))
                                               (t/before? (datetime/now) (datetime/parse (:end (:duration (:content avustushaku)))))]))

(defmethod avustushaku-phase ["published" true true]  [_] "current")
(defmethod avustushaku-phase ["published" true false] [_] "ended")
(defmethod avustushaku-phase :default  [_] "upcoming")

(defn avustushaku-response-content [avustushaku]
  {:id          (:id avustushaku)
   :status      (:status avustushaku)
   :phase       (avustushaku-phase avustushaku)
   :content     (:content avustushaku)
   :form        (:form avustushaku)})