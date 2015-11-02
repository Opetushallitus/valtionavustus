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
            [cemerick.url :refer [map->query]]
            [oph.soresu.common.config :refer [config config-simple-name login-url]]
            [oph.soresu.common.routes :refer :all]
            [oph.va.routes :refer :all]
            [oph.va.jdbc.enums :refer :all]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.auth :as auth]
            [oph.soresu.form.schema :refer :all]
            [oph.va.schema :refer :all]
            [oph.va.virkailija.schema :refer :all]
            [oph.va.virkailija.handlers :refer :all]
            [oph.va.virkailija.scoring :refer :all]
            [oph.va.virkailija.saved-search :refer :all]))

(def opintopolku-logout-url (str (-> config :opintopolku :url) (-> config :opintopolku :cas-logout)))

(defn- on-healthcheck []
  (if (and (virkailija-db/health-check)
           (hakija-api/health-check))
    (ok {})
    (not-found)))

(defn- arvio-json [arvio]
  {:id (:id arvio)
   :status (:status arvio)
   :budget-granted (:budget_granted arvio)})

(defn- add-arvio [arviot hakemus]
  (if-let [arvio (get arviot (:id hakemus))]
    (assoc hakemus :arvio arvio)
    (assoc hakemus :arvio {:id -1
                           :status "unhandled"
                           :budget-granted 0})))

(defn- get-arviot-map [hakemukset]
  (->> hakemukset
       (map :id)
       (virkailija-db/get-arviot)
       (map (fn [arvio] [(:hakemus_id arvio) (arvio-json arvio)]))
       (into {})))

(defn- add-arviot [haku-data]
  (let [hakemukset (:hakemukset haku-data)
        arviot (get-arviot-map hakemukset)
        budget-granted-sum (reduce + (map :budget-granted (vals arviot)))]
    (-> haku-data
        (assoc :hakemukset (map (partial add-arvio arviot) hakemukset))
        (assoc :budget-granted-sum budget-granted-sum))))

(defn- add-scores-to-hakemus [scores hakemus]
  (if-let [hakemus-scores (-> (fn [score-entry] (= (-> hakemus :arvio :id) (:arvio-id score-entry)))
                              (filter scores)
                              first)]
    (assoc-in hakemus [:arvio :scoring] hakemus-scores)
    hakemus))

(defn- add-scores [scores haku-data]
  (let [hakemukset (:hakemukset haku-data)]
    (-> haku-data
        (assoc :hakemukset (map (partial add-scores-to-hakemus scores) hakemukset)))))

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
  (GET "/admin/*" [] (return-html "admin.html"))
  (GET "/yhteenveto/*" [] (return-html "summary.html"))
  (GET* "/hakemus-preview/:avustushaku-id/:hakemus-user-key" []
    :path-params [avustushaku-id :- Long, hakemus-user-key :- s/Str]
    (on-hakemus-preview avustushaku-id hakemus-user-key))
  (GET "/translations.json" [] (get-translations))
  (GET "/avustushaku/:id/*" [id] (return-html "index.html"))
  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))

(defn- add-copy-suffixes [nameField]
  { :fi (str (:fi nameField) " (kopio)" )
    :sv (str (:sv nameField) " (kopia)")})

(defroutes* avustushaku-routes
  "Hakemus listing and filtering"

  (GET* "/" []
        :return [AvustusHaku]
        (if-let [response (hakija-api/list-avustushaut)]
          (ok response)
          (not-found)))

  (GET* "/status/:status" []
        :path-params [status :- HakuStatus]
        :return [AvustusHaku]
        (if-let [response (hakija-api/list-avustushaut-by-status status)]
          (ok response)
          (not-found)))

  (PUT* "/" []
        :body [base-haku-id-wrapper (describe {:baseHakuId Long} "id of avustushaku to use as base") ]
        :return AvustusHaku
        (let [base-haku (-> base-haku-id-wrapper
                            :baseHakuId
                            (hakija-api/get-hakudata)
                            :avustushaku)
              {:keys [name selection-criteria self-financing-percentage focus-areas]} (:content base-haku)
              form-id (:form base-haku)]
          (ok (hakija-api/create-avustushaku
                        {:name (add-copy-suffixes name)
                         :duration {:start (clj-time/plus (clj-time/now) (clj-time/months 1))
                                    :end (clj-time/plus (clj-time/now) (clj-time/months 2))
                                    :label {:fi "Hakuaika"
                                            :sv "Ansökningstid"}}
                         :selection-criteria selection-criteria
                         :self-financing-percentage self-financing-percentage
                         :focus-areas focus-areas}
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
        (let [scores (get-avustushaku-scores avustushaku-id)]
          (if-let [response (hakija-api/get-hakudata avustushaku-id)]
                    (ok (->> response
                             add-arviot
                             (add-scores scores)))
                    (not-found))))

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
        (let [identity (auth/get-identity request)]
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
          (not-found)))

  (GET* "/:avustushaku-id/hakemus/:hakemus-id/scores" [avustushaku-id hakemus-id :as request]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :return ScoringOfArvio
        (if-let [arvio (virkailija-db/get-arvio hakemus-id)]
          (ok (get-arvio-scores avustushaku-id (:id arvio)))
          (ok {:scoring nil
               :scores []})))

  (POST* "/:avustushaku-id/hakemus/:hakemus-id/scores" [avustushaku-id hakemus-id :as request]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :body [score (describe NewScore "Stored or updated score")]
        :return ScoringOfArvio
        (let [identity (auth/get-identity request)]
          (ok (add-score avustushaku-id
                         hakemus-id
                         identity
                         (:selection-criteria-index score)
                         (:score score)))))

  (POST* "/:avustushaku-id/hakemus/:hakemus-id/register-number" [avustushaku-id hakemus-id]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :body [body (describe {:register-number s/Str} "Register number (diaarinumero)")]
        :return {:hakemus-id Long
                 :register-number s/Str}
        (hakija-api/set-register-number hakemus-id (:register-number body))
        (ok {:hakemus-id hakemus-id
             :register-number (:register-number body)}))

  (PUT* "/:avustushaku-id/searches" [avustushaku-id :as request]
        :path-params [avustushaku-id :- Long]
        :body [body (describe SavedSearch "New stored search")]
        :return {:search-url s/Str}
        (let [identity (auth/get-identity request)
              search-id (create-or-get-search avustushaku-id body identity)
              search-url (str "/yhteenveto/avustushaku/" avustushaku-id "/listaus/" search-id "/")]
          (ok {:search-url search-url})))

  (GET* "/:avustushaku-id/searches/:saved-search-id" [avustushaku-id saved-search-id]
          :path-params [avustushaku-id :- Long, saved-search-id :- Long]
          :return SavedSearch
          (let [saved-search (get-saved-search avustushaku-id saved-search-id)]
            (ok (:query saved-search)))))

(defroutes* userinfo-routes
  "User information"

  (GET "/" [:as request]
       (ok (auth/get-identity request))))

(defn- query-string-for-login [original-query-params params-to-add keys-to-remove]
  (let [payload-params (apply dissoc original-query-params keys-to-remove)
        complete-params (merge payload-params params-to-add)]
    (if (not (empty? complete-params))
      (->> complete-params map->query (str "?")))))

(defroutes* login-routes
  "Authentication"

  (GET "/logged-out" [] (return-html "login.html"))

  (GET* "/cas" [ticket :as request]
        :query-params [{ticket :- s/Str nil}]
        :return s/Any
        :summary "Handle login ticket from cas"
        (try
          (if ticket
            (if-let [identity (auth/authenticate ticket)]
              (let [original-url (-> request :session :original-url)]
                (-> (if original-url original-url "/")
                    (resp/redirect)
                    (assoc :session {:identity identity})))
              (resp/redirect (str "/login/logged-out" (query-string-for-login (:query-params request) {"not-permitted" "true"} []))))
            (resp/redirect (str "/login/logged-out" (query-string-for-login (:query-params request) {} []))))
          (catch Exception e
            (log/error "Error in login ticket handling" e)
            (resp/redirect (str "/login/logged-out" (query-string-for-login (:query-params request) {"error" "true"} []))))))

  (POST* "/cas" [logoutRequest :as request]
    :form-params [logoutRequest :- s/Str]
    :return s/Any
    :summary "Handle logout request from cas"
      (auth/cas-initiated-logout logoutRequest))

  (GET "/logout" [:as request]
        (auth/logout (-> request :session :identity))
        (-> (resp/redirect (str opintopolku-logout-url login-url))
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
