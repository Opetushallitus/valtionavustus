(ns ^{:skip-aot true} oph.va.virkailija.routes
    (:use [clojure.tools.trace :only [trace]]
          [clojure.pprint :only [pprint]])
  (:require [compojure.route :as route]
            [clojure.tools.logging :as log]
            [clj-time.core :as clj-time]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [defroutes GET POST]]
            [compojure.api.sweet :refer :all]
            [compojure.api.exception :as compojure-ex]
            [ring.swagger.json-schema-dirty]
            [schema.core :as s]
            [oph.common.config :refer [config config-simple-name]]
            [oph.common.routes :refer :all]
            [oph.va.routes :refer :all]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.auth :as auth]
            [oph.form.schema :refer :all]
            [oph.va.schema :refer :all]
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

(defn- on-hakemus-preview [avustushaku-id hakemus-user-key]
  (let [hakija-app-url (-> config :server :url :fi)
        preview-url (str hakija-app-url "avustushaku/" avustushaku-id "/nayta?hakemus=" hakemus-user-key "&preview=true")]
    (resp/redirect preview-url)))

(defroutes* healthcheck-routes
  "Healthcheck routes"

  (GET* "/" [] (on-healthcheck))
  (HEAD* "/" [] (on-healthcheck)))

(defroutes resource-routes
  (GET "/" [] (return-html "index.html"))
  (GET "/admin" [] (return-html "admin.html"))
  (GET* "/hakemus-preview/:avustushaku-id/:hakemus-user-key" []
    :path-params [avustushaku-id :- Long, hakemus-user-key :- s/Str]
    (on-hakemus-preview avustushaku-id hakemus-user-key))
  (GET "/translations.json" [] (get-translations))
  (GET "/avustushaku/:id" [id] (return-html "index.html"))
  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))

(defroutes* avustushaku-routes
  "Hakemus listing and filtering"

  (GET* "/" []
        :return [AvustusHaku]
        (if-let [response (hakija-api/list-avustushaut)]
          (ok response)
          (not-found)))

  (PUT* "/" []
        :body [ base-haku-id-wrapper (describe {:baseHakuId Long} "id of avustushaku to use as base") ]
        :return AvustusHaku
        (let [ base-haku (-> base-haku-id-wrapper
                             :baseHakuId
                             (hakija-api/get-avustushaku)
                             :avustushaku)
               { name :name selection-criteria :selection-criteria
                 self-financing-percentage :self-financing-percentage } (:content base-haku)
               form-id (:form base-haku)]
          (ok (hakija-api/create-avustushaku
                        {:name name
                         :duration {:start (clj-time/plus (clj-time/now) (clj-time/months 1))
                                    :end (clj-time/plus (clj-time/now) (clj-time/months 2))
                                    :label {:fi "Hakuaika"
                                            :sv "Ansökningstid"}}
                         :selection-criteria selection-criteria
                         :self-financing-percentage self-financing-percentage}
                        form-id))))

  (POST* "/:avustushaku-id" []
         :path-params [avustushaku-id :- Long]
         :body  [avustushaku (describe AvustusHaku "Updated avustushaku")]
         :return AvustusHaku
         (if-let [response (hakija-api/update-avustushaku avustushaku)]
          (ok response)
          (not-found)))

  (GET* "/:avustushaku-id" [avustushaku-id]
        :path-params [avustushaku-id :- Long]
        :return HakuData
        (if-let [response (hakija-api/get-avustushaku avustushaku-id)]
          (ok (add-arviot response))
          (not-found)))

  (GET* "/:avustushaku-id/role" [avustushaku-id]
        :path-params [avustushaku-id :- Long]
        :return [Role]
        (if-let [response (hakija-api/get-avustushaku-roles avustushaku-id)]
          (ok response)
          (not-found)))

  (PUT* "/:avustushaku-id/role" [avustushaku-id]
        :path-params [avustushaku-id :- Long]
        :return Role
        (ok (hakija-api/create-avustushaku-role {:avustushaku avustushaku-id
                                                 :role "presenting_officer"
                                                 :name ""
                                                 :email ""})))

  (POST* "/:avustushaku-id/role/:role-id" [avustushaku-id role-id]
         :path-params [avustushaku-id :- Long role-id :- Long]
         :body    [role (describe Role "Changed role")]
         :return Role
         (ok (hakija-api/update-avustushaku-role avustushaku-id role)))

  (DELETE* "/:avustushaku-id/role/:role-id" [avustushaku-id role-id]
        :path-params [avustushaku-id :- Long role-id :- Long]
        :return {:id Long}
        (hakija-api/delete-avustushaku-role avustushaku-id role-id)
        (ok {:id role-id}))


  (GET* "/:avustushaku-id/form" [avustushaku-id]
          :path-params [avustushaku-id :- Long]
          :return Form
          (if-let [found-form (hakija-api/get-form-by-avustushaku avustushaku-id)]
            (ok found-form)
            (not-found)))

  (POST* "/:avustushaku-id/form" [avustushaku-id]
         :path-params [avustushaku-id :- Long ]
         :body  [updated-form (describe Form "Updated form")]
         :return Form
         (if-let [response (hakija-api/update-form-by-avustushaku avustushaku-id updated-form)]
          (ok response)
          (not-found)))

  (POST* "/:avustushaku-id/hakemus/:hakemus-id/arvio" [avustushaku-id]
         :path-params [avustushaku-id :- Long hakemus-id :- Long]
         :body    [arvio (describe Arvio "New arvio")]
         :return Arvio
         (ok (-> (virkailija-db/update-or-create-hakemus-arvio hakemus-id arvio)
                 arvio-json)))

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
                                         (:comment comment)))))

  (GET* "/:haku-id/hakemus/:hakemus-id/attachments" [haku-id hakemus-id ]
        :path-params [haku-id :- Long, hakemus-id :- Long]
        :return s/Any
        :summary "List current attachments"
        (ok (-> (hakija-api/list-attachments hakemus-id)
                (hakija-api/attachments->map))))

  (GET* "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" [haku-id hakemus-id field-id]
        :path-params [haku-id :- Long, hakemus-id :- Long, field-id :- s/Str]
        (if (hakija-api/attachment-exists? hakemus-id field-id)
          (let [{:keys [data size filename content-type]} (hakija-api/download-attachment hakemus-id field-id)]
            (-> (ok data)
                (assoc-in [:headers "Content-Type"] content-type)
                (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"" filename "\""))))
          (not-found))))

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
                 :ignore-missing-mappings? true
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
