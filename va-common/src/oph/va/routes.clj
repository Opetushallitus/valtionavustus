(ns oph.va.routes
  (:require [oph.common.config :refer :all]))

(defn avustushaku-response-content [avustushaku]
  {:id          (:id avustushaku)
   :content     (:content avustushaku)
   :form        (:form avustushaku)
   :environment {:name      (config-simple-name)
                 :show-name (:show-environment? (:ui config))}})