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
            [oph.va.routes :refer :all]
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

(defn- arvio-json [arvio]
  {:status (:status arvio)})

(defn- add-arvio [arviot hakemus]
  (if-let [arvio (get arviot (:id hakemus))]
    (assoc hakemus :arvio arvio)
    (assoc hakemus :arvio {:status "unhandled"})))

(defn- get-arviot-map [hakemukset]
  (->> hakemukset
       (map :id)
       (virkailija-db/get-arviot)
       (map (fn [arvio] [(:hakemus_id arvio) (arvio-json arvio)]))
       (into {})))

(defn- add-arviot [haku-data]
  (let [hakemukset (:hakemukset haku-data)
        arviot (get-arviot-map hakemukset)]
    (assoc haku-data :hakemukset (map (partial add-arvio arviot) hakemukset))))

(defroutes* healthcheck-routes
  "Healthcheck routes"

  (GET* "/" [] (on-healthcheck))
  (HEAD* "/" [] (on-healthcheck)))

(defroutes resource-routes
  (GET "/" [] (return-html "index.html"))
  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))

(defroutes* avustushaku-routes
  "Hakemus listing and filtering"

  (GET* "/:avustushaku-id" [avustushaku-id]
        :path-params [avustushaku-id :- Long]
        :return HakuData
        (if-let [response (hakija-api/get-avustushaku avustushaku-id)]
          (ok (add-arviot response))
          (not-found)))

  (POST* "/:avustushaku-id/hakemus/:hakemus-id/arvio" [avustushaku-id]
      :path-params [avustushaku-id :- Long hakemus-id :- Long]
      :body    [arvio (describe Arvio "New arvio")]
      :return Arvio
      (ok (arvio-json (virkailija-db/update-or-create-hakemus-arvio hakemus-id arvio))))

  (GET* "/:avustushaku-id/hakemus/:hakemus-id/comments" [avustushaku-id hakemus-id]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :return Comments
        (ok (virkailija-db/list-comments hakemus-id)))

  (POST* "/:avustushaku-id/hakemus/:hakemus-id/comments" [avustushaku-id hakemus-id :as request]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :body [comment (describe NewComment "New comment")]
        :return Comments
        (let [identity (auth/check-identity (-> request
                                                :session
                                                :identity))]
          (ok (virkailija-db/add-comment hakemus-id
                                                   (:first-name identity)
                                                   (:surname identity)
                                                   (:email identity)
                                                   (:comment comment))))))

(defroutes* userinfo-routes
  "User information"

  (GET "/" [:as request]
       (ok (auth/check-identity (-> request
                                    :session
                                    :identity)))))

(defroutes* login-routes
  "Authentication"

  (GET "/" [] (return-html "login.html"))

  (POST* "/" [username password :as request]
        :form-params [username :- s/Str password :- s/Str]
        :return s/Any
        (if-let [identity (auth/authenticate username password)]
          (-> (resp/redirect "/")
              (assoc :session {:identity identity}))
          (resp/redirect "/login?error=true")))

  (POST "/logout" [:as request]
        (auth/logout (-> request :session :identity))
        (-> (resp/redirect "/login")
            (assoc :session nil))))

(defroutes* doc-routes
  "API documentation browser"
  (swagger-ui))

(defn- create-swagger-docs []
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name "avustushaku"
                         :description "Avustushaku and hakemus listing and filtering"}
                        {:name "login"
                         :description "Login and logout"}
                        {:name "userinfo"
                         :description "User information about currently logged in user"}
                        {:name "healthcheck"
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
  (context* "/api/userinfo" [] :tags ["userinfo"] userinfo-routes)
  (context* "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)

  ;; Documentation
  (context* "/doc" [] doc-routes)

  ;; Resources
  config-routes
  resource-routes)
