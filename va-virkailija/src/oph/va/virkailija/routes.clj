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
            [ring.swagger.json-schema-dirty]
            [schema.core :as s]
            [cemerick.url :refer [map->query]]
            [oph.soresu.common.config :refer [config config-simple-name]]
            [oph.soresu.common.routes :refer :all]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.routes :refer :all]
            [oph.va.jdbc.enums :refer :all]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.authentication :as authentication]
            [oph.va.virkailija.authorization :as authorization]
            [oph.soresu.form.schema :refer :all]
            [oph.va.schema :refer :all]
            [oph.va.virkailija.schema :refer :all]
            [oph.va.virkailija.scoring :as scoring]
            [oph.va.virkailija.saved-search :refer :all]
            [oph.va.virkailija.hakudata :as hakudata]
            [oph.va.virkailija.export :as export]
            [oph.va.virkailija.email :as email]))

(defonce opintopolku-login-url (str (-> config :opintopolku :url) (-> config :opintopolku :cas-login)))

(defonce opintopolku-logout-url (str (-> config :opintopolku :url) (-> config :opintopolku :cas-logout)))

(defonce virkailija-login-url (str (-> config :server :virkailija-url) "/login/cas"))

(defn- on-healthcheck []
  (if (and (virkailija-db/health-check)
           (hakija-api/health-check))
    (ok {})
    (not-found)))


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

(defroutes* avustushaku-routes
  "Hakemus listing and filtering"

  (GET* "/" []
        :return [AvustusHaku]
        :summary "Return list of all avustushaku descriptions"
        (if-let [response (hakija-api/list-avustushaut)]
          (ok response)
          (not-found)))

  (GET* "/status/:status" []
        :path-params [status :- HakuStatus]
        :return [AvustusHaku]
        :summary "Return list of avustushaku descriptions by status"
        (if-let [response (hakija-api/list-avustushaut-by-status status)]
          (ok response)
          (not-found)))

  (PUT* "/" [:as request]
        :body [base-haku-id-wrapper (describe {:baseHakuId Long} "id of avustushaku to use as base")]
        :return AvustusHaku
        :summary "Copy existing avustushaku as new one by id of the existing avustushaku"
        (ok (hakudata/create-new-avustushaku (:baseHakuId base-haku-id-wrapper) (authentication/get-identity request))))

  (POST* "/:avustushaku-id" []
         :path-params [avustushaku-id :- Long]
         :body  [avustushaku (describe AvustusHaku "Updated avustushaku")]
         :return AvustusHaku
         :summary "Update avustushaku description"
         (if-let [response (hakija-api/update-avustushaku avustushaku)]
           (ok response)
           (not-found)))

  (GET* "/:avustushaku-id" [avustushaku-id :as request]
        :path-params [avustushaku-id :- Long]
        :return HakuData
        :summary "Return all relevant avustushaku data (including answers, comments, form and current user privileges)"
        (let [identity (authentication/get-identity request)]
          (if-let [response (hakudata/get-combined-avustushaku-data-with-privileges avustushaku-id identity)]
            (ok response)
            (not-found))))

  (GET* "/:haku-id/export.xslx" [haku-id :as request]
        :path-params [haku-id :- Long]
        :summary "Export Excel XLSX document for given avustushaku"
        (let [identity (authentication/get-identity request)
              document (export/export-avustushaku haku-id)]
          (-> (ok document)
              (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
              (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"avustushaku-" haku-id ".xlsx\"")))))

  (GET* "/:avustushaku-id/role" [avustushaku-id]
        :path-params [avustushaku-id :- Long]
        :return [Role]
        :summary "List roles for given avustushaku"
        (if-let [response (hakija-api/get-avustushaku-roles avustushaku-id)]
          (ok response)
          (not-found)))

  (PUT* "/:avustushaku-id/role" [avustushaku-id]
        :path-params [avustushaku-id :- Long]
        :body  [new-role (describe NewRole "New role to add to avustushaku")]
        :return Role
        :summary "Create new role for avustushaku"
        (ok (hakija-api/create-avustushaku-role {:avustushaku avustushaku-id
                                                 :role (or (:role new-role) "presenting_officer")
                                                 :name (:name new-role)
                                                 :email (:email new-role)
                                                 :oid (:oid new-role)})))

  (POST* "/:avustushaku-id/role/:role-id" [avustushaku-id role-id]
         :path-params [avustushaku-id :- Long role-id :- Long]
         :body    [role (describe Role "Changed role")]
         :return Role
         :summary "Update avustushaku role"
         (ok (hakija-api/update-avustushaku-role avustushaku-id role)))

  (DELETE* "/:avustushaku-id/role/:role-id" [avustushaku-id role-id]
        :path-params [avustushaku-id :- Long role-id :- Long]
        :return {:id Long}
        :summary "Delete avustushaku role"
        (hakija-api/delete-avustushaku-role avustushaku-id role-id)
        (ok {:id role-id}))

  (GET* "/:avustushaku-id/privileges" [avustushaku-id :as request]
        :path-params [avustushaku-id :- Long]
        :return HakuPrivileges
        :summary "Show current user privileges for given avustushaku"
        (let [identity (authentication/get-identity request)
              haku-roles (hakija-api/get-avustushaku-roles avustushaku-id)
              privileges (authorization/resolve-privileges identity avustushaku-id haku-roles)]
          (if privileges
            (ok privileges)
            (not-found))))

  (GET* "/:avustushaku-id/form" [avustushaku-id]
          :path-params [avustushaku-id :- Long]
          :return Form
          :summary "Get form description that is linked to avustushaku"
          (if-let [found-form (hakija-api/get-form-by-avustushaku avustushaku-id)]
            (ok found-form)
            (not-found)))

  (POST* "/:avustushaku-id/form" [avustushaku-id]
         :path-params [avustushaku-id :- Long ]
         :body  [updated-form (describe Form "Updated form")]
         :return Form
         :summary "Update form description that is linked to avustushaku"
         (if-let [response (hakija-api/update-form-by-avustushaku avustushaku-id updated-form)]
          (ok response)
          (not-found)))

  (POST* "/:avustushaku-id/hakemus/:hakemus-id/arvio" [avustushaku-id]
         :path-params [avustushaku-id :- Long hakemus-id :- Long]
         :body    [arvio (describe Arvio "New arvio")]
         :return Arvio
         :summary "Update arvio for given hakemus. Creates arvio if missing."
         (ok (-> (virkailija-db/update-or-create-hakemus-arvio hakemus-id arvio)
                 hakudata/arvio-json)))

  (GET* "/:avustushaku-id/hakemus/:hakemus-id/comments" [avustushaku-id hakemus-id]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :return Comments
        :summary "Get current comments for hakemus"
        (ok (virkailija-db/list-comments hakemus-id)))

  (POST* "/:avustushaku-id/hakemus/:hakemus-id/comments" [avustushaku-id hakemus-id :as request]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :body [comment (describe NewComment "New comment")]
        :return Comments
        :summary "Add a comment for hakemus. As response, return all comments"
        (let [identity (authentication/get-identity request)]
          (ok (virkailija-db/add-comment hakemus-id
                                         (:first-name identity)
                                         (:surname identity)
                                         (:email identity)
                                         (:comment comment)))))

  (GET* "/:haku-id/hakemus/:hakemus-id/attachments" [haku-id hakemus-id ]
        :path-params [haku-id :- Long, hakemus-id :- Long]
        :return s/Any
        :summary "List current attachments"
        :description "Listing does not return actual attachment data. Use per-field download for getting it."
        (ok (-> (hakija-api/list-attachments hakemus-id)
                (hakija-api/attachments->map))))

  (GET* "/:haku-id/hakemus/:hakemus-id/attachments/versions" [haku-id hakemus-id ]
        :path-params [haku-id :- Long, hakemus-id :- Long]
        :return [Attachment]
        :summary "List all versions of attachments of given hakemus"
        :description "Listing does not return actual attachment data. Use per-field versioned download URL for getting it."
        (ok (->> (hakija-api/list-attachment-versions hakemus-id)
                (map hakija-api/convert-attachment))))

  (GET* "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" [haku-id hakemus-id field-id]
        :path-params [haku-id :- Long, hakemus-id :- Long, field-id :- s/Str]
        :query-params [{attachment-version :- Long nil}]
        :summary "Download attachment attached to given field"
        (if (hakija-api/attachment-exists? hakemus-id field-id)
          (let [{:keys [data size filename content-type]} (hakija-api/download-attachment hakemus-id field-id attachment-version)]
            (-> (ok data)
                (assoc-in [:headers "Content-Type"] content-type)
                (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"" filename "\""))))
          (not-found)))

  (GET* "/:avustushaku-id/hakemus/:hakemus-id/change-requests" [avustushaku-id hakemus-id :as request]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :return [Hakemus]
        :summary "List change requests of given hakemus"
        (hakija-api/list-hakemus-change-requests hakemus-id))

  (GET* "/:avustushaku-id/hakemus/:hakemus-id/scores" [avustushaku-id hakemus-id :as request]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :return ScoringOfArvio
        :summary "Get scorings for given hakemus"
        :description "Scorings are linked to avustushaku focus areas"
        (if-let [arvio (virkailija-db/get-arvio hakemus-id)]
          (ok (scoring/get-arvio-scores avustushaku-id (:id arvio)))
          (ok {:scoring nil
               :scores []})))

  (POST* "/:avustushaku-id/hakemus/:hakemus-id/scores" [avustushaku-id hakemus-id :as request]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :body [score (describe NewScore "Stored or updated score")]
        :return ScoringOfArvio
        :summary "Submit scorings for given arvio."
        :description "Scorings are automatically assigned to logged in user."
        (let [identity (authentication/get-identity request)]
          (ok (scoring/add-score avustushaku-id
                                 hakemus-id
                                 identity
                                 (:selection-criteria-index score)
                                 (:score score)))))

  (POST* "/:avustushaku-id/hakemus/:hakemus-id/status" [avustushaku-id hakemus-id :as request]
         :path-params [avustushaku-id :- Long, hakemus-id :- Long]
         :body [body {:status HakemusStatus
                      :comment s/Str}]
         :return {:hakemus-id Long
                  :status HakemusStatus}
         :summary "Update status of hakemus"
         (let [identity (authentication/get-identity request)
               new-status (:status body)
               status-comment (:comment body)
               updated-hakemus (hakija-api/update-hakemus-status hakemus-id new-status status-comment identity)]
           (if (= new-status "pending_change_request")
             (let [submission (hakija-api/get-hakemus-submission updated-hakemus)
                   answers (:answers submission)
                   language (keyword (formutil/find-answer-value answers "language"))
                   avustushaku (hakija-api/get-avustushaku avustushaku-id)
                   avustushaku-name (-> avustushaku :content :name language)
                   email (formutil/find-answer-value answers "primary-email")
                   user-key (:user_key updated-hakemus)]
               (email/send-change-request-message! language email avustushaku-id avustushaku-name user-key status-comment)))
           (ok {:hakemus-id hakemus-id
                :status new-status})))

  (PUT* "/:avustushaku-id/searches" [avustushaku-id :as request]
        :path-params [avustushaku-id :- Long]
        :body [body (describe SavedSearch "New stored search")]
        :return {:search-url s/Str}
        :summary "Create new stored search"
        :description "Stored search captures the ids of selection, and provide a stable view to hakemus data."
        (let [identity (authentication/get-identity request)
              search-id (create-or-get-search avustushaku-id body identity)
              search-url (str "/yhteenveto/avustushaku/" avustushaku-id "/listaus/" search-id "/")]
          (ok {:search-url search-url})))

  (GET* "/:avustushaku-id/searches/:saved-search-id" [avustushaku-id saved-search-id]
          :path-params [avustushaku-id :- Long, saved-search-id :- Long]
          :return SavedSearch
          :summary "Get stored search"
          :description "Stored search captures the ids of selection, and provide a stable view to hakemus data."
          (let [saved-search (get-saved-search avustushaku-id saved-search-id)]
            (ok (:query saved-search)))))

(defroutes* userinfo-routes
            "User information"

            (GET "/" [:as request]
              (ok (authentication/get-identity request))))

(defroutes* ldap-routes
  "LDAP search"

  (POST* "/search" [:as request]
          :body [body (describe {:searchInput s/Str} "User input of LDAP search box")]
          :return LdapSearchResults
          :summary "Search users from OPH LDAP."
          :description "Each search term must be found as part of user name or email. Case does not matter."
         (let [search-input (:searchInput body)
               search-results (oph.va.virkailija.ldap/search-users search-input)]
                    (ok {:results search-results
                         :error false
                         :truncated false}))))

(defn- query-string-for-login [original-query-params params-to-add keys-to-remove]
  (let [payload-params (apply dissoc original-query-params keys-to-remove)
        complete-params (merge payload-params params-to-add)]
    (if (not (empty? complete-params))
      (->> complete-params map->query (str "?")))))

(defn- url-after-login [request]
 (let [original-url (-> request :session :original-url)]
   (if original-url original-url "/")))

(defn- redirect-to-loggged-out-page [request extra-query-params]
  (resp/redirect (str "/login/logged-out" (query-string-for-login (:query-params request) extra-query-params []))))

(defroutes* login-routes
  "Authentication"

  (GET "/logged-out" [] (return-html "login.html"))

  (GET* "/cas" [ticket :as request]
        :query-params [{ticket :- s/Str nil}]
        :return s/Any
        :summary "Handle login ticket and logout callback from cas"
        (try
          (if ticket
            (if-let [identity (authentication/authenticate ticket virkailija-login-url)]
              (-> (resp/redirect (url-after-login request))
                  (assoc :session {:identity identity}))
              (redirect-to-loggged-out-page request {"not-permitted" "true"}))
            (redirect-to-loggged-out-page request {}))
          (catch Exception e
            (log/error "Error in login ticket handling" e)
            (redirect-to-loggged-out-page request {"error" "true"}))))

  (POST* "/cas" [logoutRequest :as request]
         :form-params [logoutRequest :- s/Str]
         :return s/Any
         :summary "Handle logout request from cas"
         (authentication/cas-initiated-logout logoutRequest))

  (GET "/logout" [:as request]
       (authentication/logout (-> request :session :identity))
        (-> (resp/redirect (str opintopolku-logout-url virkailija-login-url))
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
  (context* "/api/ldap" [] :tags ["ldap"] ldap-routes)
  (context* "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)

  ;; Documentation
  (context* "/doc" [] doc-routes)

  ;; Resources
  config-routes
  resource-routes)
