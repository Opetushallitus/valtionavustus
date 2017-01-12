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
            [oph.soresu.form.schema :as form-schema]
            [oph.va.schema :as va-schema]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.va.virkailija.scoring :as scoring]
            [oph.va.virkailija.saved-search :refer :all]
            [oph.va.virkailija.hakudata :as hakudata]
            [oph.va.virkailija.export :as export]
            [oph.va.virkailija.email :as email]
            [oph.va.virkailija.paatos :as paatos]
            [oph.va.virkailija.decision :as decision]
            [oph.soresu.common.koodisto :as koodisto]
            [clojure.tools.logging :as log]))

(defonce opintopolku-login-url (str (-> config :opintopolku :url) (-> config :opintopolku :cas-login)))

(defonce opintopolku-logout-url (str (-> config :opintopolku :url) (-> config :opintopolku :cas-logout)))

(defonce virkailija-login-url (str (-> config :server :virkailija-url) "/login/cas"))

(defn- on-healthcheck []
  (if (and (virkailija-db/health-check)
           (hakija-api/health-check))
    (ok {})
    (not-found)))

(defn- without-id [x]
  (dissoc x :id))

(defn- on-hakemus-preview [avustushaku-id hakemus-user-key]
  (let [hakija-app-url (-> config :server :url :fi)
        preview-url (str hakija-app-url "avustushaku/" avustushaku-id "/nayta?hakemus=" hakemus-user-key "&preview=true")]
    (resp/redirect preview-url)))

(defn- on-hakemus-edit [avustushaku-id hakemus-user-key]
  (let [hakija-app-url (-> config :server :url :fi)
        preview-url (str hakija-app-url "avustushaku/" avustushaku-id "/nayta?hakemus=" hakemus-user-key)]
    (resp/redirect preview-url)))

(defn- on-paatos-preview [avustushaku-id user-key]
  (let [hakija-app-url (-> config :server :url :fi)
        preview-url (str hakija-app-url "paatos/avustushaku/" avustushaku-id "/hakemus/" user-key "?nolog=true")]
    (resp/redirect preview-url)))

(defn- on-selvitys [avustushaku-id hakemus-user-key selvitys-type showPreview]
  (let [hakija-app-url (-> config :server :url :fi)
        preview-url (str hakija-app-url "avustushaku/" avustushaku-id "/" selvitys-type "?hakemus=" hakemus-user-key "&preview=" showPreview)]
    (resp/redirect preview-url)))

(defn- get-hakemus-and-published-avustushaku [avustushaku-id hakemus-id]
  (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
        hakemus (hakija-api/get-hakemus hakemus-id)]
    (cond
      (not hakemus) (not-found!)
      (not (= (:id avustushaku) (:avustushaku hakemus))) (bad-request!)
      (not (= "published" (:status avustushaku))) (method-not-allowed!)
      :else {:avustushaku avustushaku :hakemus hakemus})))

(defn- get-hakemus-and-avustushaku [avustushaku-id hakemus-id]
  (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
        hakemus (hakija-api/get-hakemus hakemus-id)]
    (cond
      (not hakemus) (not-found!)
      (not (= (:id avustushaku) (:avustushaku hakemus))) (bad-request!)
      :else {:avustushaku avustushaku :hakemus hakemus})))


(defroutes* healthcheck-routes
            "Healthcheck routes"

            (GET* "/" [] (on-healthcheck))
            (HEAD* "/" [] (on-healthcheck)))

(defroutes resource-routes
           (GET "/" [] (return-html "index.html"))
           (GET "/admin/*" [] (return-html "admin.html"))
           (GET "/yhteenveto/*" [] (return-html "summary.html"))
           (GET "/paatosold/*" [] (return-html "paatos.html"))
           (GET* "/hakemus-preview/:avustushaku-id/:hakemus-user-key" []
                 :path-params [avustushaku-id :- Long, hakemus-user-key :- s/Str]
                 (on-hakemus-preview avustushaku-id hakemus-user-key))
           (GET* "/hakemus-edit/:avustushaku-id/:hakemus-user-key" []
                 :path-params [avustushaku-id :- Long, hakemus-user-key :- s/Str]
                 (on-hakemus-edit avustushaku-id hakemus-user-key))
           (GET* "/public/paatos/avustushaku/:avustushaku-id/hakemus/:user-key" []
                 :path-params [avustushaku-id :- Long, user-key :- s/Str]
                 (on-paatos-preview avustushaku-id user-key))
           (GET* "/selvitys/avustushaku/:avustushaku-id/:selvitys-type" []
                 :path-params [avustushaku-id :- Long, selvitys-type :- s/Str]
                 :query-params [{hakemus :- s/Str nil},{preview :- s/Str "false"}]
                 (on-selvitys avustushaku-id hakemus selvitys-type preview))
           (GET "/translations.json" [] (get-translations))
           (GET "/avustushaku/:id/*" [id] (return-html "index.html"))
           (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
           (route/not-found "<p>Page not found.</p>"))

(defn- get-avustushaku-status []
  (GET* "/" [status]
        :query-params [{status :- [va-schema/HakuStatus] nil}]
        :return [va-schema/AvustusHaku]
        :summary "Return list of all avustushaku descriptions"
        (if-let [response (hakija-api/list-avustushaut-by-status status)]
          (ok response)
          (not-found))))

(defn- put-avustushaku []
  (PUT* "/" [:as request]
        :body [base-haku-id-wrapper (describe {:baseHakuId Long} "id of avustushaku to use as base")]
        :return va-schema/AvustusHaku
        :summary "Copy existing avustushaku as new one by id of the existing avustushaku"
        (ok (hakudata/create-new-avustushaku (:baseHakuId base-haku-id-wrapper) (authentication/get-identity request)))))

(defn- post-avustushaku []
  (POST* "/:avustushaku-id" []
         :path-params [avustushaku-id :- Long]
         :body [avustushaku (describe va-schema/AvustusHaku "Updated avustushaku")]
         :return va-schema/AvustusHaku
         :summary "Update avustushaku description"
         (if-let [response (hakija-api/update-avustushaku avustushaku)]
           (ok response)
           (not-found))))

(defn- get-avustushaku []
  (GET* "/:avustushaku-id" [avustushaku-id :as request]
        :path-params [avustushaku-id :- Long]
        :return virkailija-schema/HakuData
        :summary "Return all relevant avustushaku data (including answers, comments, form and current user privileges)"
        (let [identity (authentication/get-identity request)]
          (if-let [response (hakudata/get-combined-avustushaku-data-with-privileges avustushaku-id identity)]
            (ok response)
            (not-found)))))

(defn- get-selvitys []
  (GET* "/:avustushaku-id/hakemus/:hakemus-id/selvitys" [hakemus-id avustushaku-id :as request]
        :path-params [hakemus-id :- Long avustushaku-id :- Long]
        :return s/Any
        :summary "Return all relevant selvitys data including answers, form and attachments"
        (let [identity (authentication/get-identity request)]
          (if-let [response (hakija-api/get-selvitysdata avustushaku-id hakemus-id)]
            (ok response)
            (not-found)))))

(defn- send-selvitys []
  (POST* "/:avustushaku-id/selvitys/:selvitys-type/send" []
         :path-params [avustushaku-id :- Long selvitys-type :- s/Str]
         :body [selvitys-email (describe virkailija-schema/SelvitysEmail "Selvitys email")]
         :return s/Any
         :summary "Send selvitys and update state to sent"
         (let [selvitys-hakemus-id (:selvitys-hakemus-id selvitys-email)
               hakemus (hakija-api/get-hakemus selvitys-hakemus-id)
               parent_id (:parent_id hakemus)
               is-loppuselvitys (= selvitys-type "loppuselvitys")]
           (hakija-api/send-selvitys selvitys-email)
           (hakija-api/update-selvitys-message selvitys-email)
           (if is-loppuselvitys (hakija-api/update-loppuselvitys-status parent_id "accepted") (hakija-api/update-valiselvitys-status parent_id "accepted"))
           (ok {:status "ok"}))))

(defn- send-selvitys-email []
  (POST* "/:avustushaku-id/selvitys/:selvitys-type/send-notification" []
         :path-params [avustushaku-id :- Long selvitys-type :- s/Str]
         :return s/Any
         :summary "Sends loppuselvitys emails"
         (log/info  (str "Send emails for avustushaku " avustushaku-id))
         (paatos/send-selvitys-emails avustushaku-id selvitys-type)))

(defn- post-change-request-email []
  (POST* "/:avustushaku-id/change-request-email" []
         :path-params [avustushaku-id :- Long]
         :body [change-request (describe virkailija-schema/ChangeRequestEmail "Change request")]
         (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
               avustushaku-name (-> avustushaku :content :name :fi)
               change-request (:text change-request)]
           (ok
             {
              :mail (email/mail-example
                      :change-request {
                                       :avustushaku avustushaku-name
                                       :change-request change-request
                                       :url "[linkki hakemukseen]"})}))))

(defn- get-hakemus []
  (GET* "/paatos/:hakemus-id" [hakemus-id :as request]
        :path-params [hakemus-id :- Long]
        :return virkailija-schema/PaatosData
        :summary "Return relevant information for decision"
        (if-let [response (hakudata/get-combined-paatos-data hakemus-id)]
          (ok response)
          (not-found))))

(defn- get-haku-export []
  (GET* "/:haku-id/export.xslx" [haku-id :as request]
        :path-params [haku-id :- Long]
        :summary "Export Excel XLSX document for given avustushaku"
        (let [identity (authentication/get-identity request)
              document (export/export-avustushaku haku-id)]
          (-> (ok document)
              (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
              (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"avustushaku-" haku-id ".xlsx\""))))))

(defn- get-avustushaku-role []
  (GET* "/:avustushaku-id/role" [avustushaku-id]
        :path-params [avustushaku-id :- Long]
        :return [virkailija-schema/Role]
        :summary "List roles for given avustushaku"
        (if-let [response (hakija-api/get-avustushaku-roles avustushaku-id)]
          (ok response)
          (not-found))))

(defn- put-avustushaku-role []
  (PUT* "/:avustushaku-id/role" [avustushaku-id]
        :path-params [avustushaku-id :- Long]
        :body [new-role (describe virkailija-schema/NewRole "New role to add to avustushaku")]
        :return virkailija-schema/Role
        :summary "Create new role for avustushaku"
        (ok (hakija-api/create-avustushaku-role {:avustushaku avustushaku-id
                                                 :role (or (:role new-role) "presenting_officer")
                                                 :name (:name new-role)
                                                 :email (:email new-role)
                                                 :oid (:oid new-role)}))))

(defn- post-avustushaku-role []
  (POST* "/:avustushaku-id/role/:role-id" [avustushaku-id role-id]
         :path-params [avustushaku-id :- Long role-id :- Long]
         :body [role (describe virkailija-schema/Role "Changed role")]
         :return virkailija-schema/Role
         :summary "Update avustushaku role"
         (ok (hakija-api/update-avustushaku-role avustushaku-id role))))

(defn- del-avustushaku-role []
  (DELETE* "/:avustushaku-id/role/:role-id" [avustushaku-id role-id]
           :path-params [avustushaku-id :- Long role-id :- Long]
           :return {:id Long}
           :summary "Delete avustushaku role"
           (hakija-api/delete-avustushaku-role avustushaku-id role-id)
           (ok {:id role-id})))

(defn- get-avustushaku-privileges []
  (GET* "/:avustushaku-id/privileges" [avustushaku-id :as request]
        :path-params [avustushaku-id :- Long]
        :return virkailija-schema/HakuPrivileges
        :summary "Show current user privileges for given avustushaku"
        (let [identity (authentication/get-identity request)
              haku-roles (hakija-api/get-avustushaku-roles avustushaku-id)
              privileges (authorization/resolve-privileges identity avustushaku-id haku-roles)]
          (if privileges
            (ok privileges)
            (not-found)))))

(defn- get-avustushaku-form []
  (GET* "/:avustushaku-id/form" [avustushaku-id]
        :path-params [avustushaku-id :- Long]
        :return form-schema/Form
        :summary "Get form description that is linked to avustushaku"
        (if-let [found-form (hakija-api/get-form-by-avustushaku avustushaku-id)]
          (ok (without-id found-form))
          (not-found))))

(defn- post-avustushaku-form []
  (POST* "/:avustushaku-id/form" [avustushaku-id]
         :path-params [avustushaku-id :- Long]
         :body [updated-form (describe form-schema/Form "Updated form")]
         :return form-schema/Form
         :summary "Update form description that is linked to avustushaku"
         (if-let [avustushaku (hakija-api/get-avustushaku-by-status avustushaku-id ["new" "draft"])]
           (if-let [response (hakija-api/update-form-by-avustushaku avustushaku-id updated-form)]
             (ok (without-id response))
             (not-found))
           (method-not-allowed!))))

(defn- post-hakemus-arvio []
  (POST* "/:avustushaku-id/hakemus/:hakemus-id/arvio" [avustushaku-id :as request]
         :path-params [avustushaku-id :- Long hakemus-id :- Long]
         :body [arvio (describe virkailija-schema/Arvio "New arvio")]
         :return virkailija-schema/Arvio
         :summary "Update arvio for given hakemus. Creates arvio if missing."
         (let [identity (authentication/get-identity request)
               avustushaku (hakija-api/get-avustushaku avustushaku-id)]
           (ok (-> (virkailija-db/update-or-create-hakemus-arvio avustushaku hakemus-id arvio identity)
                   hakudata/arvio-json)))))

(defn- get-hakemus-comments []
  (GET* "/:avustushaku-id/hakemus/:hakemus-id/comments" [avustushaku-id hakemus-id]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :return virkailija-schema/Comments
        :summary "Get current comments for hakemus"
        (ok (virkailija-db/list-comments hakemus-id))))

(defn- post-hakemus-comments []
  (POST* "/:avustushaku-id/hakemus/:hakemus-id/comments" [avustushaku-id hakemus-id :as request]
         :path-params [avustushaku-id :- Long, hakemus-id :- Long]
         :body [comment (describe virkailija-schema/NewComment "New comment")]
         :return virkailija-schema/Comments
         :summary "Add a comment for hakemus. As response, return all comments"
         (let [identity (authentication/get-identity request)
               {:keys [avustushaku hakemus]} (get-hakemus-and-published-avustushaku avustushaku-id hakemus-id)]
           (ok (virkailija-db/add-comment hakemus-id
                                          (:first-name identity)
                                          (:surname identity)
                                          (:email identity)
                                          (:comment comment))))))
(defn- get-hakemus-attachments []
  (GET* "/:haku-id/hakemus/:hakemus-id/attachments" [haku-id hakemus-id]
        :path-params [haku-id :- Long, hakemus-id :- Long]
        :return s/Any
        :summary "List current attachments"
        :description "Listing does not return actual attachment data. Use per-field download for getting it."
        (ok (-> (hakija-api/list-attachments hakemus-id)
                (hakija-api/attachments->map)))))

(defn- get-hakemus-attachments-versions []
  (GET* "/:haku-id/hakemus/:hakemus-id/attachments/versions" [haku-id hakemus-id]
        :path-params [haku-id :- Long, hakemus-id :- Long]
        :return [va-schema/Attachment]
        :summary "List all versions of attachments of given hakemus"
        :description "Listing does not return actual attachment data. Use per-field versioned download URL for getting it."
        (ok (->> (hakija-api/list-attachment-versions hakemus-id)
                 (map hakija-api/convert-attachment)))))

(defn- get-hakemus-attachment []
  (GET* "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" [haku-id hakemus-id field-id]
        :path-params [haku-id :- Long, hakemus-id :- Long, field-id :- s/Str]
        :query-params [{attachment-version :- Long nil}]
        :summary "Download attachment attached to given field"
        (if (hakija-api/attachment-exists? hakemus-id field-id)
          (let [{:keys [data size filename content-type]} (hakija-api/download-attachment hakemus-id field-id attachment-version)]
            (-> (ok data)
                (assoc-in [:headers "Content-Type"] content-type)
                (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"" filename "\""))))
          (not-found))))
(defn- post-init-selvitysform []
  (POST* "/:avustushaku-id/init-selvitysform/:selvitys-type" [avustushaku-id selvitys-type]
         :path-params [avustushaku-id :- Long selvitys-type :- s/Str]
         :body [form (describe form-schema/Form "Form to create")]
         :return form-schema/Form
         :summary "Create of finds selvitys form for given avustushaku"
         (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
               form-keyword (keyword (str "form_" selvitys-type))
               form-keyword-value (form-keyword avustushaku)
               ]
           (if (nil? form-keyword-value)
             (let [
                   created-form (hakija-api/create-form form)
                   form-id (:id created-form)
                   loppuselvitys (= selvitys-type "loppuselvitys")]
               (if loppuselvitys
                 (hakija-api/update-avustushaku-form-loppuselvitys avustushaku-id form-id)
                 (hakija-api/update-avustushaku-form-valiselvitys avustushaku-id form-id))
               (ok (without-id created-form)))
             (let [found-form (hakija-api/get-form-by-id form-keyword-value)]
               (ok (without-id found-form)))))))

(defn- post-selvitysform []
  (POST* "/:avustushaku-id/selvitysform/:selvitys-type" [avustushaku-id selvitys-type]
         :path-params [avustushaku-id :- Long selvitys-type :- s/Str]
         :body [updated-form (describe form-schema/Form "Updated form")]
         :return form-schema/Form
         :summary "Update selvitys form"
         (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
               form-keyword (keyword (str "form_" selvitys-type))
               form-id (form-keyword avustushaku)
               response (hakija-api/update-form form-id updated-form)]
           (ok (without-id response)))))

(defn- get-change-requests []
  (GET* "/:avustushaku-id/hakemus/:hakemus-id/change-requests" [avustushaku-id hakemus-id :as request]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :return [virkailija-schema/Hakemus]
        :summary "List change requests of given hakemus"
        (hakija-api/list-hakemus-change-requests hakemus-id)))

(defn- get-scores []
  (GET* "/:avustushaku-id/hakemus/:hakemus-id/scores" [avustushaku-id hakemus-id :as request]
        :path-params [avustushaku-id :- Long, hakemus-id :- Long]
        :return virkailija-schema/ScoringOfArvio
        :summary "Get scorings for given hakemus"
        :description "Scorings are linked to avustushaku focus areas"
        (if-let [arvio (virkailija-db/get-arvio hakemus-id)]
          (ok (scoring/get-arvio-scores avustushaku-id (:id arvio)))
          (ok {:scoring nil
               :scores []}))))

(defn- post-scores []
  (POST* "/:avustushaku-id/hakemus/:hakemus-id/scores" [avustushaku-id hakemus-id :as request]
         :path-params [avustushaku-id :- Long, hakemus-id :- Long]
         :body [score (describe virkailija-schema/NewScore "Stored or updated score")]
         :return virkailija-schema/ScoringOfArvio
         :summary "Submit scorings for given arvio."
         :description "Scorings are automatically assigned to logged in user."
         (let [identity (authentication/get-identity request)
               {:keys [avustushaku hakemus]} (get-hakemus-and-published-avustushaku avustushaku-id hakemus-id)]
           (ok (scoring/add-score avustushaku-id
                                  hakemus-id
                                  identity
                                  (:selection-criteria-index score)
                                  (:score score))))))

(defn- post-status []
  (POST* "/:avustushaku-id/hakemus/:hakemus-id/status" [avustushaku-id hakemus-id :as request]
         :path-params [avustushaku-id :- Long, hakemus-id :- Long]
         :body [body {:status va-schema/HakemusStatus
                      :comment s/Str}]
         :return {:hakemus-id Long
                  :status va-schema/HakemusStatus}
         :summary "Update status of hakemus"
         (let [{:keys [avustushaku hakemus]} (get-hakemus-and-published-avustushaku avustushaku-id hakemus-id)
               identity (authentication/get-identity request)
               new-status (:status body)
               status-comment (:comment body)
               updated-hakemus (hakija-api/update-hakemus-status hakemus new-status status-comment identity)]
           (if (= new-status "pending_change_request")
             (let [submission (hakija-api/get-hakemus-submission updated-hakemus)
                   answers (:answers submission)
                   language (keyword (formutil/find-answer-value answers "language"))
                   avustushaku-name (-> avustushaku :content :name language)
                   email (formutil/find-answer-value answers "primary-email")
                   user-key (:user_key updated-hakemus)
                   presenting-officer-email (:email identity)]
               (email/send-change-request-message! language email avustushaku-id avustushaku-name user-key status-comment presenting-officer-email)))
           (ok {:hakemus-id hakemus-id
                :status new-status}))))

(defn- put-searches []
  (PUT* "/:avustushaku-id/searches" [avustushaku-id :as request]
        :path-params [avustushaku-id :- Long]
        :body [body (describe virkailija-schema/SavedSearch "New stored search")]
        :return {:search-url s/Str}
        :summary "Create new stored search"
        :description "Stored search captures the ids of selection, and provide a stable view to hakemus data."
        (let [identity (authentication/get-identity request)
              search-id (create-or-get-search avustushaku-id body identity)
              search-url (str "/yhteenveto/avustushaku/" avustushaku-id "/listaus/" search-id "/")]
          (ok {:search-url search-url}))))

(defn- get-search []
  (GET* "/:avustushaku-id/searches/:saved-search-id" [avustushaku-id saved-search-id]
        :path-params [avustushaku-id :- Long, saved-search-id :- Long]
        :return virkailija-schema/SavedSearch
        :summary "Get stored search"
        :description "Stored search captures the ids of selection, and provide a stable view to hakemus data."
        (let [saved-search (get-saved-search avustushaku-id saved-search-id)]
          (ok (:query saved-search)))))

(defroutes* avustushaku-routes
            "Hakemus listing and filtering"
            (get-avustushaku-status)
            (put-avustushaku)
            (post-avustushaku)
            (get-avustushaku)
            (get-selvitys)
            (send-selvitys)
            (send-selvitys-email)
            (post-change-request-email)
            (get-hakemus)
            (get-haku-export)
            (get-avustushaku-role)
            (put-avustushaku-role)
            (post-avustushaku-role)
            (del-avustushaku-role)
            (get-avustushaku-privileges)
            (get-avustushaku-form)
            (post-avustushaku-form)
            (post-hakemus-arvio)
            (get-hakemus-comments)
            (post-hakemus-comments)
            (get-hakemus-attachments)
            (get-hakemus-attachments-versions)
            (get-hakemus-attachment)
            (post-init-selvitysform)
            (post-selvitysform)
            (get-change-requests)
            (get-scores)
            (post-scores)
            (put-searches)
            (get-search)


            (POST* "/:avustushaku-id/hakemus/:hakemus-id/status" [avustushaku-id hakemus-id :as request]
                   :path-params [avustushaku-id :- Long, hakemus-id :- Long]
                   :body [body {:status va-schema/HakemusStatus
                                :comment s/Str}]
                   :return {:hakemus-id Long
                            :status va-schema/HakemusStatus}
                   :summary "Update status of hakemus"
                   (let [{:keys [avustushaku hakemus]} (get-hakemus-and-avustushaku avustushaku-id hakemus-id)
                         identity (authentication/get-identity request)
                         new-status (:status body)
                         status-comment (:comment body)
                         updated-hakemus (hakija-api/update-hakemus-status hakemus new-status status-comment identity)]
                     (if (= new-status "pending_change_request")
                       (let [submission (hakija-api/get-hakemus-submission updated-hakemus)
                             answers (:answers submission)
                             language (keyword (formutil/find-answer-value answers "language"))
                             avustushaku-name (-> avustushaku :content :name language)
                             email (formutil/find-answer-value answers "primary-email")
                             user-key (:user_key updated-hakemus)
                             presenting-officer-email (:email identity)]
                         (email/send-change-request-message! language email avustushaku-id avustushaku-name user-key status-comment presenting-officer-email)))
                     (ok {:hakemus-id hakemus-id
                          :status new-status})))

            )


(defroutes* public-routes
            "Public API"

            (GET* "/avustushaku/:avustushaku-id/paatokset" [avustushaku-id :as request]
                  :path-params [avustushaku-id :- Long]
                  :return s/Any
                  :summary "Get paatokset"
                  :description "Get paatokset public info"
                    (ok (hakudata/get-avustushaku-and-paatokset avustushaku-id)))

            (GET* "/avustushaku/paatos/:user-key" [user-key :as request]
                  :path-params [user-key :- String]
                  :return virkailija-schema/PaatosData
                  :summary "Return relevant information for decision"
                  (let [hakemus (hakija-api/get-hakemus-by-user-key user-key)
                        hakemus-id (:id hakemus)]
                    (if-let [response (hakudata/get-final-combined-paatos-data hakemus-id)]
                      (-> (ok response)
                          (assoc-in [:headers "Access-Control-Allow-Origin"] "*"))
                      (not-found)))))

(defroutes* userinfo-routes
            "User information"

            (GET "/" [:as request]
              (ok (authentication/get-identity request))))

(defroutes* ldap-routes
            "LDAP search"

            (POST* "/search" [:as request]
                   :body [body (describe {:searchInput s/Str} "User input of LDAP search box")]
                   :return virkailija-schema/LdapSearchResults
                   :summary "Search users from OPH LDAP."
                   :description "Each search term must be found as part of user name or email. Case does not matter."
                   (let [search-input (:searchInput body)
                         search-results (oph.va.virkailija.ldap/search-users search-input)]
                     (ok {:results search-results
                          :error false
                          :truncated false}))))

(defroutes* koodisto-routes
            "Koodisto-service access"

            (GET* "/" []
                  :return s/Any
                  :summary "List the available koodisto items"
                  :description "One of these can be selected for a Koodisto based input form field."
                  (let [koodisto-list (koodisto/list-koodistos)]
                    (ok koodisto-list)))

            (GET* "/:koodisto-uri/:version" [koodisto-uri version]
                  :path-params [koodisto-uri :- s/Str version :- Long]
                  :return s/Any
                  :summary "List contents of certain version of certain koodisto"
                  :description "Choice values and labels for each value"
                  (let [koodi-options (koodisto/get-cached-koodi-options :form-db koodisto-uri version)]
                    (ok (:content koodi-options)))))

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

  (context* "/public/api" [] :tags ["public"] public-routes)
  (context* "/api/avustushaku" [] :tags ["avustushaku"] avustushaku-routes)
  (context* "/login" [] :tags ["login"] login-routes)
  (context* "/api/userinfo" [] :tags ["userinfo"] userinfo-routes)
  (context* "/api/ldap" [] :tags ["ldap"] ldap-routes)
  (context* "/api/koodisto" [] :tags ["koodisto"] koodisto-routes)
  (context* "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)
  (context* "/api/paatos" [] :tags ["paatos"] paatos/paatos-routes)
  (context* "/paatos" [] :tags ["paatos"] decision/decision-routes)

  ;; Documentation
  (context* "/doc" [] doc-routes)

  ;; Resources
  config-routes
  resource-routes)
