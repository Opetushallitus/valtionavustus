(ns oph.va.virkailija.avustushaku-routes
  (:require [clojure.tools.logging :as log]
            [compojure.api.sweet :as compojure-api]
            [oph.common.datetime :as datetime]
            [oph.soresu.common.db :refer [with-tx]]
            [oph.soresu.form.formutil :as formutil]
            [oph.soresu.form.schema :as form-schema]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.schema :as va-schema]
            [oph.va.virkailija.authentication :as authentication]
            [oph.va.virkailija.authorization :as authorization]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.email :as email]
            [oph.va.virkailija.excel.all-avustushakus-export :refer [export-avustushakus]]
            [oph.va.virkailija.export :as export]
            [oph.va.virkailija.hakemus-search :as hakemus-search]
            [oph.va.virkailija.hakudata :as hakudata]
            [oph.va.virkailija.paatos :as paatos]
            [oph.va.virkailija.saved-search :as saved-search]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.va.virkailija.scoring :as scoring]
            [oph.va.virkailija.tapahtumaloki :as tapahtumaloki]
            [ring.util.http-response :as http]
            [schema.core :as s])
  (:import [java.io ByteArrayInputStream]))

(defn- without-id [x]
  (dissoc x :id))

(defn- get-hakemus-and-its-avustushaku [avustushaku-id hakemus-id]
  (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
        hakemus (hakija-api/get-hakemus hakemus-id)]
    (cond
      (not hakemus) (http/not-found!)
      (not (= (:id avustushaku) (:avustushaku hakemus))) (http/bad-request!)
      :else {:avustushaku avustushaku :hakemus hakemus})))

(defn- get-hakemus-and-its-published-avustushaku [avustushaku-id hakemus-id]
  (let [{:keys [avustushaku] :as hakemus-and-avustushaku} (get-hakemus-and-its-avustushaku avustushaku-id hakemus-id)]
    (if (= "published" (:status avustushaku))
      hakemus-and-avustushaku
      (http/method-not-allowed!))))

(defn- get-all-avustushaku-exports []
  (compojure-api/GET "/export.xlsx" []
                     :summary "Export Excel XLSX document with all avustushakus"
                     (let [document (-> (export-avustushakus)
                                        (ByteArrayInputStream.))] 
                       (-> (http/ok document)
                           (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
                           (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"avustushaut.xlsx\""))))))

(defn- get-avustushaku-status []
  (compojure-api/GET "/" []
                     :query-params [{status :- [va-schema/HakuStatus] nil}]
                     :return [va-schema/AvustusHaku]
                     :summary "Return list of all avustushaku descriptions"
                     (if-let [response (hakija-api/list-avustushaut-by-status status)]
                       (http/ok response)
                       (http/not-found))))

(defn- identity->str [{:keys [first-name surname person-oid]}]
  (str first-name " " surname " (" person-oid ")"))

(defn- put-avustushaku []
  (compojure-api/PUT "/" request
                     :body [base-haku-id-wrapper (compojure-api/describe {:baseHakuId Long} "id of avustushaku to use as base")]
                     :return va-schema/AvustusHaku
                     :summary "Copy existing avustushaku as new one by id of the existing avustushaku"
                     (log/info "User" (identity->str identity) "copies avustushaku" (:baseHakuId base-haku-id-wrapper))
                     (with-tx (fn [tx]
                       (http/ok (hakudata/create-new-avustushaku tx (:baseHakuId base-haku-id-wrapper) (authentication/get-request-identity request)))))))

(defn- post-avustushaku []
  (compojure-api/POST "/:avustushaku-id" []
                      :path-params [avustushaku-id :- Long]
                      :body [avustushaku (compojure-api/describe va-schema/AvustusHaku "Updated avustushaku")]
                      :return va-schema/AvustusHaku
                      :summary "Update avustushaku description"
                      (if-let [response (hakija-api/update-avustushaku avustushaku)]
                        (http/ok response)
                        (http/not-found))))

(defn- get-avustushaku []
  (compojure-api/GET "/:avustushaku-id" request
                     :path-params [avustushaku-id :- Long]
                     :return virkailija-schema/HakuData
                     :summary "Return all relevant avustushaku data (including answers, comments, form and current user privileges)"
                     (let [identity (authentication/get-request-identity request)]
                       (if-let [response (hakudata/get-combined-avustushaku-data-with-privileges avustushaku-id identity)]
                         (http/ok response)
                         (http/not-found)))))

(defn- get-muutoshakemukset []
  (compojure-api/GET "/:avustushaku-id/hakemus/:hakemus-id/muutoshakemus/" [hakemus-id]
                     :path-params [hakemus-id :- Long]
                     :return  va-schema/MuutoshakemusList
                     :summary "Get muutoshakemukset"
                     (http/ok (virkailija-db/get-muutoshakemukset hakemus-id))))

(defn- get-onko-muutoshakukelpoinen-avustushaku-ok []
  (compojure-api/GET "/:avustushaku-id/onko-muutoshakukelpoinen-avustushaku-ok" []
                     :path-params [avustushaku-id :- Long]
                     :return virkailija-schema/OnkoMuutoshakukelpoinenAvustushakuOk
                     :summary "Juuh"
                     (http/ok (virkailija-db/onko-muutoshakukelpoinen-avustushaku-ok avustushaku-id))))

(defn- post-muutoshakemus-paatos []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/muutoshakemus/:muutoshakemus-id/paatos" request
                      :path-params [avustushaku-id :- Long hakemus-id :- Long muutoshakemus-id :- Long]
                      :body [paatos (compojure-api/describe virkailija-schema/MuutoshakemusPaatosRequest "Muutoshakemus paatos")]
                      :return va-schema/MuutoshakemusList
                      :summary "Create a paatos for muutoshakemus"
                      (let [{:keys [avustushaku hakemus]} (get-hakemus-and-its-avustushaku avustushaku-id hakemus-id)
                            roles (hakija-api/get-avustushaku-roles avustushaku-id)
                            arvio (virkailija-db/get-arvio hakemus-id)
                            contact-email (virkailija-db/get-normalized-hakemus-contact-email hakemus-id)
                            identity (authentication/get-request-identity request)
                            decider (str (:first-name identity) " " (:surname identity))
                            paatos (virkailija-db/create-muutoshakemus-paatos muutoshakemus-id paatos decider avustushaku-id)
                            token (virkailija-db/create-application-token (:id hakemus))]
                        (email/send-muutoshakemus-paatos [contact-email] avustushaku hakemus arvio roles token muutoshakemus-id paatos)
                        (http/ok (virkailija-db/get-muutoshakemukset hakemus-id)))))

(defn- put-searches []
  (compojure-api/PUT "/:avustushaku-id/searches" request
                     :path-params [avustushaku-id :- Long]
                     :body [body (compojure-api/describe virkailija-schema/SavedSearch "New stored search")]
                     :return {:search-url s/Str}
                     :summary "Create new stored search"
                     :description "Stored search captures the ids of selection, and provide a stable view to hakemus data."
                     (let [identity (authentication/get-request-identity request)
                           search-id (saved-search/create-or-get-search avustushaku-id body identity)
                           search-url (str "/yhteenveto/avustushaku/" avustushaku-id "/listaus/" search-id "/")]
                       (http/ok {:search-url search-url}))))

(defn- get-normalized-hakemus []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/normalized" [haku-id hakemus-id]
    :path-params [haku-id :- Long hakemus-id :- Long]
    :return  va-schema/NormalizedHakemus
    :summary "Get normalized answers"
    (if-let [normalized-hakemus (virkailija-db/get-normalized-hakemus hakemus-id)]
      (http/ok normalized-hakemus)
      (http/not-found)
      )))


(defn- get-selvitys []
  (compojure-api/GET "/:avustushaku-id/hakemus/:hakemus-id/selvitys" request
                     :path-params [hakemus-id :- Long avustushaku-id :- Long]
                     :return s/Any
                     :summary "Return all relevant selvitys data including answers, form and attachments"
                     (if-let [response (hakija-api/get-selvitysdata avustushaku-id hakemus-id)]
                       (http/ok response)
                       (http/not-found))))

(defn- verify-loppuselvitys-information []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/loppuselvitys/verify-information" request
                      :path-params [avustushaku-id :- Long hakemus-id :- Long]
                      :body [verify-information {:message s/Str}]
                      :return s/Any
                      :summary "Set loppuselvitys information verified"
                      (let [identity (authentication/get-request-identity request)
                            response (hakija-api/verify-loppuselvitys-information hakemus-id verify-information identity)]
                        (if response
                          (http/ok response)
                          (http/bad-request!)))))

(defn- send-selvitys []
  (compojure-api/POST "/:avustushaku-id/selvitys/:selvitys-type/send" request
                      :path-params [avustushaku-id :- Long selvitys-type :- s/Str]
                      :body [selvitys-email (compojure-api/describe virkailija-schema/SelvitysEmail "Selvitys email")]
                      :return s/Any
                      :summary "Send selvitys and update state to sent"
                      (let [identity (authentication/get-request-identity request)]
                         (if (hakija-api/set-selvitys-accepted selvitys-type selvitys-email identity)
                           (http/ok {:status "ok"})
                           (http/bad-request!)))
                      ))

(defn- send-selvitys-email []
  (compojure-api/POST "/:avustushaku-id/selvitys/:selvitys-type/send-notification" request
                      :path-params [avustushaku-id :- Long selvitys-type :- s/Str]
                      :return s/Any
                      :summary "Sends loppuselvitys emails"
                      (let [uuid (.toString (java.util.UUID/randomUUID))
                            identity (authentication/get-request-identity request)]
                        (log/info  (str "Send emails for avustushaku " avustushaku-id))
                        (paatos/send-selvitys-emails avustushaku-id selvitys-type uuid identity))))

(defn- re-send-paatos-email []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/re-send-paatos" request
                      :path-params [avustushaku-id :- Long hakemus-id :- Long]
                      :return s/Any
                      :summary "Re-sends paatos emails"
                      (log/info  (str "Re-send emails for application " hakemus-id))
                      (paatos/re-send-paatos-email
                        hakemus-id (.toString (java.util.UUID/randomUUID)) (authentication/get-request-identity request))))

(defn- post-change-request-email []
  (compojure-api/POST "/:avustushaku-id/change-request-email" [avustushaku-id]
                      :path-params [avustushaku-id :- Long]
                      :body [change-request (compojure-api/describe virkailija-schema/ChangeRequestEmail "Change request")]
                      (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
                            avustushaku-name (-> avustushaku :content :name :fi)
                            change-request (:text change-request)]
                        (http/ok {:mail (email/mail-example
                                    :change-request {:avustushaku avustushaku-name
                                                     :change-request change-request
                                                     :url "[linkki hakemukseen]"})}))))

(defn- get-avustushaku-export []
  (compojure-api/GET "/:haku-id/export.xslx" [haku-id]
                     :path-params [haku-id :- Long]
                     :summary "Export Excel XLSX document for avustushaku"
                     (let [document (-> (hakudata/get-hakudata-for-export haku-id)
                                        export/export-avustushaku
                                        (ByteArrayInputStream.))]
                       (-> (http/ok document)
                           (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
                           (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"avustushaku-" haku-id ".xlsx\""))))))

(defn- get-avustushaku-role []
  (compojure-api/GET "/:avustushaku-id/role" [avustushaku-id]
                     :path-params [avustushaku-id :- Long]
                     :return [virkailija-schema/Role]
                     :summary "List roles for given avustushaku"
                     (if-let [response (hakija-api/get-avustushaku-roles avustushaku-id)]
                       (http/ok response)
                       (http/not-found))))

(defn- put-avustushaku-role []
  (compojure-api/PUT "/:avustushaku-id/role" []
                     :path-params [avustushaku-id :- Long]
                     :body [new-role (compojure-api/describe virkailija-schema/NewRole "New role to add to avustushaku")]
                     :return virkailija-schema/Role
                     :summary "Create new role for avustushaku"
                     (with-tx (fn [tx]
                       (http/ok (hakija-api/create-avustushaku-role tx
                                                               {:avustushaku avustushaku-id
                                                                :role (or (:role new-role) "presenting_officer")
                                                                :name (:name new-role)
                                                                :email (:email new-role)
                                                                :oid (:oid new-role)}))))))

(defn- post-avustushaku-role []
  (compojure-api/POST "/:avustushaku-id/role/:role-id" []
                      :path-params [avustushaku-id :- Long role-id :- Long]
                      :body [role (compojure-api/describe virkailija-schema/Role "Changed role")]
                      :return virkailija-schema/Role
                      :summary "Update avustushaku role"
                      (with-tx (fn [tx]
                        (http/ok (hakija-api/update-avustushaku-role tx avustushaku-id role))))))

(defn- del-avustushaku-role []
  (compojure-api/DELETE "/:avustushaku-id/role/:role-id" []
                        :path-params [avustushaku-id :- Long role-id :- Long]
                        :return {:id Long}
                        :summary "Delete avustushaku role"
                        (hakija-api/delete-avustushaku-role avustushaku-id role-id)
                        (http/ok {:id role-id})))

(defn- get-avustushaku-privileges []
  (compojure-api/GET "/:avustushaku-id/privileges" request
                     :path-params [avustushaku-id :- Long]
                     :return virkailija-schema/HakuPrivileges
                     :summary "Show current user privileges for given avustushaku"
                     (let [user-identity   (authentication/get-request-identity request)
                           user-haku-role  (hakija-api/get-avustushaku-role-by-avustushaku-id-and-person-oid avustushaku-id (:person-oid user-identity))
                           user-privileges (authorization/resolve-user-privileges user-identity user-haku-role)]
                       (if user-privileges
                         (http/ok user-privileges)
                         (http/not-found)))))

(defn- get-avustushaku-form []
  (compojure-api/GET "/:avustushaku-id/form" []
                     :path-params [avustushaku-id :- Long]
                     :return form-schema/Form
                     :summary "Get form description that is linked to avustushaku"
                     (if-let [found-form (hakija-api/get-form-by-avustushaku avustushaku-id)]
                       (http/ok (without-id found-form))
                       (http/not-found))))

(defn- post-avustushaku-form []
  (compojure-api/POST "/:avustushaku-id/form" []
                      :path-params [avustushaku-id :- Long]
                      :body [updated-form (compojure-api/describe form-schema/Form "Updated form")]
                      :return form-schema/Form
                      :summary "Update form description that is linked to avustushaku"
                      (if-let [avustushaku (hakija-api/get-avustushaku-by-status avustushaku-id ["new" "draft"])]
                        (let [response (hakija-api/update-form-by-avustushaku avustushaku-id updated-form)
                              menoluokka-rows (virkailija-db/upsert-menoluokka-rows avustushaku-id updated-form)]
                            (if response
                              (http/ok (without-id response))
                              (http/not-found)))
                        (http/method-not-allowed!))))

(defn- post-hakemus-arvio []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/arvio" request
                      :path-params [avustushaku-id :- Long hakemus-id :- Long]
                      :body [arvio (compojure-api/describe virkailija-schema/Arvio "New arvio")]
                      :return virkailija-schema/Arvio
                      :summary "Update arvio for given hakemus. Creates arvio if missing."
                      (if-let [avustushaku (hakija-api/get-avustushaku avustushaku-id)]
                        (let [identity (authentication/get-request-identity request)]
                          (http/ok (-> (virkailija-db/update-or-create-hakemus-arvio avustushaku hakemus-id arvio identity)
                                  hakudata/arvio-json)))
                        (http/not-found))))

(defn- get-hakemus-comments []
  (compojure-api/GET "/:avustushaku-id/hakemus/:hakemus-id/comments" []
                     :path-params [avustushaku-id :- Long, hakemus-id :- Long]
                     :return virkailija-schema/Comments
                     :summary "Get current comments for hakemus"
                     (http/ok (virkailija-db/list-comments hakemus-id))))

(defn- post-hakemus-comments []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/comments" request
                      :path-params [avustushaku-id :- Long, hakemus-id :- Long]
                      :body [comment (compojure-api/describe virkailija-schema/NewComment "New comment")]
                      :return virkailija-schema/Comments
                      :summary "Add a comment for hakemus. As response, return all comments"
                      (let [identity (authentication/get-request-identity request)
                            _avustushaku_and_hakemus_exists? (get-hakemus-and-its-published-avustushaku avustushaku-id hakemus-id)]
                        (http/ok (virkailija-db/add-comment hakemus-id
                                                       (:first-name identity)
                                                       (:surname identity)
                                                       (:email identity)
                                                       (:comment comment)
                                                       (:person-oid identity))))))
(defn- get-hakemus-attachments []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/attachments" []
                     :path-params [haku-id :- Long, hakemus-id :- Long]
                     :return s/Any
                     :summary "List current attachments"
                     :description "Listing does not return actual attachment data. Use per-field download for getting it."
                     (http/ok (-> (hakija-api/list-attachments hakemus-id)
                             (hakija-api/attachments->map)))))

(defn- get-hakemus-attachments-versions []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/attachments/versions" []
                     :path-params [haku-id :- Long, hakemus-id :- Long]
                     :return [va-schema/Attachment]
                     :summary "List all versions of attachments of given hakemus"
                     :description "Listing does not return actual attachment data. Use per-field versioned download URL for getting it."
                     (http/ok (->> (hakija-api/list-attachment-versions hakemus-id)
                              (map hakija-api/convert-attachment)))))

(defn- get-hakemus-attachment []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" []
                     :path-params [haku-id :- Long, hakemus-id :- Long, field-id :- s/Str]
                     :query-params [{attachment-version :- Long nil}]
                     :summary "Download attachment attached to given field"
                     (if (hakija-api/attachment-exists? hakemus-id field-id)
                       (let [{:keys [data size filename content-type]} (hakija-api/download-attachment hakemus-id field-id attachment-version)]
                         (-> (http/ok data)
                             (assoc-in [:headers "Content-Type"] content-type)
                             (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"" filename "\""))))
                       (http/not-found))))

(defn- sql-constraint-exception? [ex constraint-name]
  (-> ex .getCause .getServerErrorMessage .getConstraint (= constraint-name)))

(defn- post-init-selvitysform []
  (compojure-api/POST "/:avustushaku-id/init-selvitysform/:selvitys-type" []
                      :path-params [avustushaku-id :- Long selvitys-type :- s/Str]
                      :body [form (compojure-api/describe form-schema/Form "Form to create")]
                      :return form-schema/Form
                      :summary "Create of finds selvitys form for given avustushaku"
                      (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
                            form-keyword (keyword (str "form_" selvitys-type))
                            form-keyword-value (form-keyword avustushaku)]
                        (if (nil? form-keyword-value)
                          (let [created-form (hakija-api/create-form form (datetime/from-sql-time (:created_at avustushaku)))
                                form-id (:id created-form)
                                loppuselvitys (= selvitys-type "loppuselvitys")]
                            (try
                              (if loppuselvitys
                                (hakija-api/update-avustushaku-form-loppuselvitys avustushaku-id form-id)
                                (hakija-api/update-avustushaku-form-valiselvitys avustushaku-id form-id))
                              (catch java.sql.BatchUpdateException ex
                                (if (sql-constraint-exception? ex "nn_alkamispaiva")
                                  (log/info "Ignoring nn_alkamispaiva constraint violation")
                                  (throw ex))))
                            (http/ok (without-id created-form)))
                          (let [found-form (hakija-api/get-form-by-id form-keyword-value)]
                            (http/ok (without-id found-form)))))))

(defn- post-selvitysform []
  (compojure-api/POST "/:avustushaku-id/selvitysform/:selvitys-type" []
                      :path-params [avustushaku-id :- Long selvitys-type :- s/Str]
                      :body [updated-form (compojure-api/describe form-schema/Form "Updated form")]
                      :return form-schema/Form
                      :summary "Update selvitys form"
                      (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
                            form-keyword (keyword (str "form_" selvitys-type))
                            form-id (form-keyword avustushaku)
                            response (hakija-api/update-form form-id updated-form)]
                        (http/ok (without-id response)))))

(defn- get-change-requests []
  (compojure-api/GET "/:avustushaku-id/hakemus/:hakemus-id/change-requests" []
                     :path-params [avustushaku-id :- Long, hakemus-id :- Long]
                     :return [virkailija-schema/Hakemus]
                     :summary "List change requests of given hakemus"
                     (hakija-api/list-hakemus-change-requests hakemus-id)))

(defn- get-scores []
  (compojure-api/GET "/:avustushaku-id/hakemus/:hakemus-id/scores" []
                     :path-params [avustushaku-id :- Long, hakemus-id :- Long]
                     :return virkailija-schema/ScoringOfArvio
                     :summary "Get scorings for given hakemus"
                     :description "Scorings are linked to avustushaku focus areas"
                     (if-let [arvio (virkailija-db/get-arvio hakemus-id)]
                       (http/ok (scoring/get-arvio-scores avustushaku-id (:id arvio)))
                       (http/ok {:scoring nil
                            :scores []}))))

(defn- post-scores []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/scores" request
                      :path-params [avustushaku-id :- Long, hakemus-id :- Long]
                      :body [score (compojure-api/describe virkailija-schema/NewScore "Stored or updated score")]
                      :return virkailija-schema/ScoringOfArvio
                      :summary "Submit scorings for given arvio."
                      :description "Scorings are automatically assigned to logged in user."
                      (let [identity (authentication/get-request-identity request)
                            _avustushaku_and_hakemus_exists? (get-hakemus-and-its-published-avustushaku avustushaku-id hakemus-id)]
                        (http/ok (scoring/add-score avustushaku-id
                                               hakemus-id
                                               identity
                                               (:selection-criteria-index score)
                                               (:score score))))))

(defn- delete-score []
  (compojure-api/DELETE "/evaluations/:id/scores/:index/" request
                        :path-params [id :- Long, index :- Long]
                        :summary "Delete score"
                        :description "Delete application score given by user"
                        (let [identity (authentication/get-request-identity request)]
                          (scoring/delete-score id index identity)
                          (http/ok ""))))

(defn- post-hakemus-status []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/status" request
                      :path-params [avustushaku-id :- Long, hakemus-id :- Long]
                      :body [body {:status va-schema/HakemusStatus
                                   :comment s/Str}]
                      :return {:hakemus-id Long
                               :status va-schema/HakemusStatus}
                      :summary "Update status of hakemus"
                      (let [{:keys [avustushaku hakemus]} (get-hakemus-and-its-avustushaku avustushaku-id hakemus-id)
                            identity (authentication/get-request-identity request)
                            new-status (:status body)
                            status-comment (:comment body)]
                        (if (and (= "cancelled" new-status) (= "resolved" (:status avustushaku)))
                          (http/method-not-allowed!))
                        (let [updated-hakemus (hakija-api/update-hakemus-status hakemus new-status status-comment identity)]
                          (if (= new-status "pending_change_request")
                            (let [submission (hakija-api/get-hakemus-submission updated-hakemus)
                                  answers (:answers submission)
                                  language (keyword (or (formutil/find-answer-value answers "language") "fi"))
                                  avustushaku-name (-> avustushaku :content :name language)
                                  email (formutil/find-answer-value answers "primary-email")
                                  user-key (:user_key updated-hakemus)
                                  presenting-officer-email (:email identity)]
                              (email/send-change-request-message! language email avustushaku-id hakemus-id avustushaku-name user-key status-comment presenting-officer-email)))
                          (if (= new-status "submitted")
                            (virkailija-db/update-submitted-hakemus-version (:id hakemus)))
                          (http/ok {:hakemus-id hakemus-id
                               :status new-status})))))

(defn- get-search []
  (compojure-api/GET "/:avustushaku-id/searches/:saved-search-id" []
                     :path-params [avustushaku-id :- Long, saved-search-id :- Long]
                     :return virkailija-schema/SavedSearch
                     :summary "Get stored search"
                     :description "Stored search captures the ids of selection, and provide a stable view to hakemus data."
                     (let [saved-search (saved-search/get-saved-search avustushaku-id saved-search-id)]
                       (http/ok (:query saved-search)))))

(defn- get-tapahtumaloki []
  (compojure-api/GET "/:avustushaku-id/tapahtumaloki/:tyyppi" []
                     :path-params [avustushaku-id :- Long, tyyppi :- s/Str]
                     (http/ok (tapahtumaloki/get-tapahtumaloki-entries tyyppi avustushaku-id))))

(compojure-api/defroutes avustushaku-routes
  "Hakemus listing and filtering"

  (get-all-avustushaku-exports)

  (compojure-api/GET "/search" []
    :query-params [organization-name :- virkailija-schema/AvustushakuOrganizationNameQuery]
    :return s/Any
    :summary "Search hakemukset by organization name. Organization-name must have length of at least 3."
    (http/ok (hakemus-search/find-hakemukset-by-organization-name organization-name)))

  (compojure-api/GET "/listing" []
    :summary "Return list of all avustushaku with extra fields for listing ui"
    :return [va-schema/ListingAvustushaku]
    (if-let [response (hakija-api/get-avustushaut-for-haku-listing)]
      (http/ok response)
      (http/not-found)))

  (get-avustushaku-status)
  (get-normalized-hakemus)
  (put-avustushaku)
  (post-avustushaku)
  (get-avustushaku)
  (get-onko-muutoshakukelpoinen-avustushaku-ok)
  (get-muutoshakemukset)
  (post-muutoshakemus-paatos)
  (get-selvitys)
  (verify-loppuselvitys-information)
  (send-selvitys)
  (send-selvitys-email)
  (re-send-paatos-email)
  (post-change-request-email)
  (get-avustushaku-export)
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
  (delete-score)
  (post-hakemus-status)
  (put-searches)
  (get-search)
  (get-tapahtumaloki))
