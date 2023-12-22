(ns oph.va.virkailija.avustushaku-routes
  (:require [clojure.tools.logging :as log]
            [compojure.api.sweet :as compojure-api]
            [oph.common.datetime :as datetime]
            [oph.soresu.common.db :refer [with-tx]]
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
            [oph.va.virkailija.projects :as projects]
            [oph.va.virkailija.avustushaku_talousarviotilit :as talousarvio]
            [oph.va.virkailija.saved-search :as saved-search]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.va.virkailija.scoring :as scoring]
            [oph.va.virkailija.tapahtumaloki :as tapahtumaloki]
            [ring.util.http-response :as http]
            [schema.core :as s])
  (:import [java.io ByteArrayInputStream]))

(defn- without-id [x]
  (dissoc x :id))

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

(defn- get-arviointi-dropdown-avustushaut []
  (compojure-api/GET "/arviointi/dropdown" []
    :return [va-schema/ArviointiDropdownAvustushaut]
    :summary "Return avustushaku data to be shown in arviointi dropdown"
    (if-let [response (virkailija-db/get-arviointi-dropdown-avustushaut)]
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

(defn- get-hakemus-ids-having-taydennyspyynto []
  (compojure-api/GET "/:avustushaku-id/hakemus-ids-having-taydennyspyynto" []
                     :path-params [avustushaku-id :- Long]
                     :return  va-schema/HakemusIdList
                     :summary "Palauta lista avustushaun hakemus-id:stä, joille on joskus lähetetty täydennyspyyntö"
                     (http/ok (virkailija-db/get-hakemus-ids-having-taydennyspyynto avustushaku-id))))

(defn- get-onko-muutoshakukelpoinen-avustushaku-ok []
  (compojure-api/GET "/:avustushaku-id/onko-muutoshakukelpoinen-avustushaku-ok" []
                     :path-params [avustushaku-id :- Long]
                     :return virkailija-schema/OnkoMuutoshakukelpoinenAvustushakuOk
                     :summary "Juuh"
                     (http/ok (virkailija-db/onko-muutoshakukelpoinen-avustushaku-ok avustushaku-id))))

(defn- get-projects []
  (compojure-api/GET "/:avustushaku-id/projects" []
                     :path-params [avustushaku-id :- Long]
                     :return [virkailija-schema/VACodeValue]
                     (http/ok (projects/get-projects avustushaku-id))))

(defn- post-projects []
  (compojure-api/POST "/:avustushaku-id/projects" []
                     :path-params [avustushaku-id :- Long]
                     :body [projects-body (compojure-api/describe [virkailija-schema/VACodeValue] "Avustushaun projektit")]
                     :return s/Any
                     (http/ok (projects/update-projects avustushaku-id projects-body))))


(defn- get-avustushaku-talousarviotilit []
  (compojure-api/GET "/:avustushaku-id/talousarviotilit" []
    :path-params [avustushaku-id :- Long]
    :return [virkailija-schema/AvustushakuTalousarviotili]
    (http/ok (talousarvio/get-avustushaku-talousarviotilit avustushaku-id))))

(defn- post-avustushaku-talousarviotilit []
  (compojure-api/POST "/:avustushaku-id/talousarviotilit" []
                      :path-params [avustushaku-id :- Long]
                      :body [talousarviotilit (compojure-api/describe [virkailija-schema/AvustushakuTalousarviotili] "Avustushaun talousarviotilit")]
                      :return s/Any
                      (http/ok (talousarvio/post-avustushaku-talousarviotilit avustushaku-id talousarviotilit))))

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

(defn- post-change-request-email []
  (compojure-api/POST "/:avustushaku-id/change-request-email" request
                      :path-params [avustushaku-id :- Long]
                      :body [change-request (compojure-api/describe virkailija-schema/ChangeRequestEmail "Change request")]
                      (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
                            avustushaku-name (-> avustushaku :content :name :fi)
                            change-request (:text change-request)
                            identity (authentication/get-request-identity request)
                            presenting-officer-email (:email identity)]
                           (http/ok {:mail (email/mail-example
                                     :taydennyspyynto {:avustushaku avustushaku-name
                                                       :taydennyspyynto change-request
                                                       :yhteyshenkilo presenting-officer-email
                                                       :url "[linkki hakemukseen]"})}))))

(defn- get-avustushaku-export []
  (compojure-api/GET "/:avustushaku-id/export.xslx" [haku-id]
                     :path-params [avustushaku-id :- Long]
                     :summary "Export Excel XLSX document for avustushaku"
                     (let [document (-> (hakudata/get-hakudata-for-export avustushaku-id)
                                        export/export-avustushaku
                                        (ByteArrayInputStream.))]
                       (-> (http/ok document)
                           (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
                           (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"avustushaku-" avustushaku-id ".xlsx\""))))))

(defn- get-hallinnoiavustuksia-export []
  (compojure-api/GET "/:avustushaku-id/hallinnoiavustuksia.xslx" [haku-id]
                     :path-params [avustushaku-id :- Long]
                     :summary "Export Excel XLSX document for hallinnoiavustuksia.fi / tutkiavustuksia.fi"
                     (if (hakija-api/get-avustushaku avustushaku-id)
                       (let [document (-> (export/export-avustushaku-for-hallinnoiavustuksia avustushaku-id)
                                          (ByteArrayInputStream.))]
                         (-> (http/ok document)
                             (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
                             (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"hallinnoiavustuksia-" avustushaku-id ".xlsx\""))))
                       (http/not-found))))

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


(defn- get-avustushaku-raportointivelvoitteet []
  (compojure-api/GET "/:avustushaku-id/raportointivelvoitteet" []
                     :path-params [avustushaku-id :- Long]
                     :return [virkailija-schema/Raportointivelvoite]
                     :summary "List raportointivelvoitteet for given avustushaku"
                     (http/ok (virkailija-db/get-raportointivelvoitteet avustushaku-id))))

(defn- put-avustushaku-raportointivelvoite []
  (compojure-api/PUT "/:avustushaku-id/raportointivelvoite" []
                     :path-params [avustushaku-id :- Long]
                     :body [raportointivelvoite (compojure-api/describe virkailija-schema/RaportointivelvoiteData "New velvoite")]
                     :return virkailija-schema/Raportointivelvoite
                     :summary "Create new raportointivelvoite for avustushaku"
                     (http/ok (virkailija-db/insert-raportointivelvoite avustushaku-id raportointivelvoite))))

(defn- post-avustushaku-raportointivelvoite []
  (compojure-api/POST "/:avustushaku-id/raportointivelvoite/:raportointivelvoite-id" []
                      :path-params [avustushaku-id :- Long raportointivelvoite-id :- Long]
                      :body [raportointivelvoite (compojure-api/describe virkailija-schema/Raportointivelvoite "Changed velvoite")]
                      :return virkailija-schema/Raportointivelvoite
                      :summary "Update avustushaku raportointivelvoite"
                      (virkailija-db/update-raportointivelvoite avustushaku-id raportointivelvoite)
                      (http/ok raportointivelvoite)))

(defn- del-avustushaku-raportointivelvoite []
  (compojure-api/DELETE "/:avustushaku-id/raportointivelvoite/:raportointivelvoite-id" []
                        :path-params [avustushaku-id :- Long raportointivelvoite-id :- Long]
                        :return {:id Long}
                        :summary "Delete avustushaku raportointivelvoite"
                        (virkailija-db/delete-raportointivelvoite avustushaku-id raportointivelvoite-id)
                        (http/ok {:id raportointivelvoite-id})))

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
                        (let [response (hakija-api/update-form-by-avustushaku avustushaku-id updated-form)]
                            (if response
                              (http/ok (without-id response))
                              (http/not-found)))
                        (http/method-not-allowed!))))

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

(defn- delete-score []
  (compojure-api/DELETE "/evaluations/:id/scores/:index/" request
                        :path-params [id :- Long, index :- Long]
                        :summary "Delete score"
                        :description "Delete application score given by user"
                        (let [identity (authentication/get-request-identity request)]
                          (scoring/delete-score id index identity)
                          (http/ok ""))))

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

(defn- get-avustushaku-lainsaadanto []
  (compojure-api/GET "/:avustushaku-id/lainsaadanto" []
                     :path-params [avustushaku-id :- Long]
                     (http/ok (virkailija-db/get-avustushaku-lainsaadanto avustushaku-id))))

(defn- post-avustushaku-lainsaadanto []
  (compojure-api/POST "/:avustushaku-id/lainsaadanto" request
                      :path-params [avustushaku-id :- Long]
                      :body [body [s/Int]]
                      (http/ok (virkailija-db/upsert-avustushaku-lainsaadanto avustushaku-id body))))


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

  (compojure-api/GET "/lainsaadanto-options" []
    :summary "Return list of all lainsaadantos"
    :return [virkailija-schema/Lainsaadanto]
    (http/ok (virkailija-db/get-lainsaadanto-options)))

  (get-avustushaku-status)
  (put-avustushaku)
  (post-avustushaku)
  (get-avustushaku)
  (get-hakemus-ids-having-taydennyspyynto)
  (get-onko-muutoshakukelpoinen-avustushaku-ok)
  (send-selvitys)
  (send-selvitys-email)
  (post-change-request-email)
  (get-avustushaku-export)
  (get-hallinnoiavustuksia-export)
  (get-avustushaku-role)
  (put-avustushaku-role)
  (post-avustushaku-role)
  (del-avustushaku-role)
  (get-avustushaku-raportointivelvoitteet)
  (put-avustushaku-raportointivelvoite)
  (post-avustushaku-raportointivelvoite)
  (del-avustushaku-raportointivelvoite)
  (post-avustushaku-lainsaadanto)
  (get-avustushaku-lainsaadanto)
  (get-avustushaku-privileges)
  (get-avustushaku-form)
  (post-avustushaku-form)
  (post-init-selvitysform)
  (post-selvitysform)
  (delete-score)
  (put-searches)
  (get-search)
  (get-projects)
  (post-projects)
  (get-avustushaku-talousarviotilit)
  (post-avustushaku-talousarviotilit)
  (get-arviointi-dropdown-avustushaut)
  (get-tapahtumaloki))
