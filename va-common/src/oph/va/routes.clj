(ns oph.va.routes
  (:require [oph.soresu.common.config :refer :all]
            [oph.soresu.common.routes :refer :all]
            [ring.util.http-response :refer :all]
            [compojure.core :as compojure]
            [compojure.api.sweet :as compojure-api]
            [clj-time.core :as t]
            [oph.common.datetime :as datetime]
            [oph.va.schema :refer :all]
            [schema.core :as s]
            [clojure.tools.logging :as log]))

(defn environment-content []
  (let [common-environment {:name (config-simple-name)
                            :show-name (:show-environment? (:ui config))
                            :hakija-server {:url (:url (:server config))}
                            :virkailija-server {:url (:virkailija-url (:server config))}
                            :paatos-path (:paatos-path (:ui config))
                            :payments (:payments config)}
        opintopolku (:opintopolku config)]
    (if-let [opintopolku-url (:url opintopolku)]
      (assoc common-environment :opintopolku {:url opintopolku-url
                                              :permission-request (:permission-request opintopolku)})
      common-environment)))

(defn virkailija-url []
  (-> (environment-content) :virkailija-server :url))

(defn get-translations []
  (return-from-classpath "translations.json" "application/json; charset=utf-8"))

(def logo-route
  (compojure-api/GET "/img/logo.png" []
    :summary "Permanent url for logo. The url allows changing the logo later. The "
             "image height must be an integer multiple of 50px so that the result "
             "of image downscaling made by the browser is crisp."
    (-> (resource-response "public/img/logo-176x50@2x.png")
        (content-type "image/png"))))

(compojure-api/defroutes config-routes
  (compojure-api/GET "/environment" []
    :return Environment
    (ok (environment-content)))

  (compojure-api/GET "/translations.json" []
    :summary "Translated messages (localization)"
    (get-translations))

  (compojure-api/POST "/errorlogger" []
    :body [stacktrace (compojure-api/describe s/Any "JavaScript stack trace")]
    :return nil
    :summary "Sends client errors to serverside"
    (log/warn stacktrace)
    (ok)))

(defmulti avustushaku-phase (fn [avustushaku] [(:status avustushaku)
                                               (t/after? (datetime/now) (datetime/parse (:start (:duration (:content avustushaku)))))
                                               (t/before? (datetime/now) (datetime/parse (:end (:duration (:content avustushaku)))))]))

(defmethod avustushaku-phase ["published" true true]  [_] "current")
(defmethod avustushaku-phase ["published" true false] [_] "ended")
(defmethod avustushaku-phase ["published" false true] [_] "upcoming")
(defmethod avustushaku-phase ["resolved" true false] [_] "ended")
(defmethod avustushaku-phase :default  [_] "unpublished")

(defn avustushaku-response-content [avustushaku]
  {:id          (:id avustushaku)
   :status      (:status avustushaku)
   :register-number (:register_number avustushaku)
   :haku-type   (:haku_type avustushaku)
   :is_academysize (:is_academysize avustushaku)
   :phase       (avustushaku-phase avustushaku)
   :content     (:content avustushaku)
   :decision    (:decision avustushaku)
   :valiselvitysdate (:valiselvitysdate avustushaku)
   :loppuselvitysdate (:loppuselvitysdate avustushaku)
   :form        (:form avustushaku)
   :form_loppuselvitys        (:form_loppuselvitys avustushaku)
   :form_valiselvitys         (:form_valiselvitys avustushaku)})
