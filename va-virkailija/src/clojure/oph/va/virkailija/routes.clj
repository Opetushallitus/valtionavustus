(ns oph.va.virkailija.routes
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:use [clojure.java.io])
  (:use [clojure.set :only [rename-keys]])
  (:require [clojure.tools.logging :as log]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [oph.soresu.common.db :refer [exec query execute! with-tx]]
            [clojure.java.jdbc :as jdbc]
            [compojure.core :as compojure]
            [compojure.route :as compojure-route]
            [compojure.api.sweet :as compojure-api]
            [compojure.api.exception :as compojure-ex]
            [ring.swagger.json-schema-dirty]  ; for schema.core/conditional
            [schema.core :as s]
            [cemerick.url :refer [map->query]]
            [oph.soresu.common.config :refer [config]]
            [oph.soresu.common.routes :refer :all]
            [oph.soresu.form.formutil :as formutil]
            [oph.common.datetime :as datetime]
            [oph.common.string :refer [derive-token-hash]]
            [oph.va.routes :as va-routes]
            [oph.va.jdbc.enums :refer :all]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.authentication :as authentication]
            [oph.va.virkailija.authorization :as authorization]
            [oph.va.virkailija.rondo-scheduling :refer [handle-payment-response-xml]]
            [oph.va.virkailija.rondo-scheduling :refer [put-maksupalaute-to-maksatuspalvelu]]
            [oph.va.virkailija.rondo-scheduling :refer [processMaksupalaute]]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.remote-file-service :refer [get-all-maksatukset-from-maksatuspalvelu]]
            [oph.soresu.form.schema :as form-schema]
            [oph.va.schema :as va-schema]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.va.virkailija.scoring :as scoring]
            [oph.va.virkailija.saved-search :refer :all]
            [oph.va.virkailija.tapahtumaloki :as tapahtumaloki]
            [oph.va.virkailija.hakudata :as hakudata]
            [oph.va.virkailija.export :as export]
            [oph.va.virkailija.email :as email]
            [oph.va.virkailija.paatos :as paatos]
            [oph.va.virkailija.decision :as decision]
            [oph.va.virkailija.hakemus-search :as hakemus-search]
            [oph.va.virkailija.va-users :as va-users]
            [oph.soresu.common.koodisto :as koodisto]
            [oph.va.virkailija.grant-routes :as grant-routes]
            [oph.va.virkailija.application-routes :as application-routes]
            [oph.va.virkailija.reporting-data :as reporting]
            [oph.va.virkailija.payment-batches-routes :as payment-batches-routes]
            [oph.va.virkailija.va-code-values-routes :as va-code-values-routes]
            [oph.va.virkailija.payments-routes :as payments-routes]
            [oph.va.virkailija.healthcheck :as healthcheck]
            [oph.va.virkailija.reporting-routes :as reporting-routes]
            [oph.va.virkailija.external :as external]
            [oph.va.virkailija.help-texts :as help-texts]
            [oph.va.virkailija.virkailija-notifications :as virkailija-notifications])
  (:import [java.io ByteArrayInputStream]))

(def opintopolku-login-url
  (when-not *compile-files*
    (str (-> config :opintopolku :url) (-> config :opintopolku :cas-login))))

(def opintopolku-logout-url
  (when-not *compile-files*
    (str (-> config :opintopolku :url) (-> config :opintopolku :cas-logout))))

(def virkailija-login-url
  (when-not *compile-files*
    (str (-> config :server :virkailija-url) "/login/cas")))

(defn- on-healthcheck []
  (if (virkailija-db/health-check)
    (ok {})
    (not-found)))

(defn- on-integration-healthcheck []
  (ok (healthcheck/get-last-status)))

(defn- without-id [x]
  (dissoc x :id))

(defn- on-hakemus-preview [avustushaku-id hakemus-user-key decision-version]
  (let [hakemus (hakija-api/get-hakemus-by-user-key hakemus-user-key)
        language (keyword (:language hakemus))
        hakija-app-url (-> config :server :url language)
        preview-url (str
                     hakija-app-url "avustushaku/" avustushaku-id
                     "/nayta?hakemus=" hakemus-user-key
                     (when decision-version "&decision-version=true")
                     "&preview=true")]
    (resp/redirect preview-url)))

(defn- on-hakemus-edit [avustushaku-id hakemus-user-key identity]
  (let [hakemus (hakija-api/get-hakemus-by-user-key hakemus-user-key)
        language (keyword (:language hakemus))
        hakija-app-url (-> config :server :url language)
        token (apply str (repeatedly 32 #(rand-nth "abcdefghijklmnopqrstuvwxyz0123456789")))
        hash (derive-token-hash token)]
    (resp/redirect (str hakija-app-url "avustushaku/" avustushaku-id "/nayta?hakemus=" hakemus-user-key "&officerToken=" token "&officerHash=" hash))))

(defn- on-paatos-preview [avustushaku-id user-key]
  (let [hakemus (hakija-api/get-hakemus-by-user-key user-key)
        language (keyword (:language hakemus))
        hakija-app-url (-> config :server :url language)
        preview-url (str hakija-app-url "paatos/avustushaku/" avustushaku-id "/hakemus/" user-key "?nolog=true")]
    (resp/redirect preview-url)))

(defn- on-selvitys [avustushaku-id hakemus-user-key selvitys-type showPreview]
  (let [hakemus (hakija-api/get-hakemus-by-user-key hakemus-user-key)
        language (keyword (:language hakemus))
        hakija-app-url (-> config :server :url language)
        preview-url (str hakija-app-url "avustushaku/" avustushaku-id "/" selvitys-type "?hakemus=" hakemus-user-key "&preview=" showPreview)]
    (resp/redirect preview-url)))

(defn- get-hakemus-and-its-avustushaku [avustushaku-id hakemus-id]
  (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
        hakemus (hakija-api/get-hakemus hakemus-id)]
    (cond
      (not hakemus) (not-found!)
      (not (= (:id avustushaku) (:avustushaku hakemus))) (bad-request!)
      :else {:avustushaku avustushaku :hakemus hakemus})))

(defn- post-muutoshakemus-paatos []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/muutoshakemus/:muutoshakemus-id/paatos" request
                      :path-params [avustushaku-id :- Long hakemus-id :- Long muutoshakemus-id :- Long]
                      :body [paatos (compojure-api/describe virkailija-schema/MuutoshakemusPaatosRequest "Muutoshakemus paatos")]
                      :return virkailija-schema/MuutoshakemusPaatos
                      :summary "Create a paatos for muutoshakemus"
                      (let [{:keys [avustushaku hakemus]} (get-hakemus-and-its-avustushaku avustushaku-id hakemus-id)
                            roles (hakija-api/get-avustushaku-roles avustushaku-id)
                            arvio (virkailija-db/get-arvio hakemus-id)
                            contact-email (virkailija-db/get-normalized-hakemus-contact-email hakemus-id)
                            identity (authentication/get-request-identity request)
                            decider (str (:first-name identity) " " (:surname identity))
                            paatos (virkailija-db/create-muutoshakemus-paatos muutoshakemus-id paatos decider avustushaku-id)
                            muutoshakemus-url (virkailija-db/get-muutoshakemus-url-by-hakemus-id (:id hakemus))
                            token (virkailija-db/create-application-token (:id hakemus))]
                        (email/send-muutoshakemus-paatos [contact-email] avustushaku hakemus arvio roles token muutoshakemus-id paatos)
                        (ok (assoc paatos :muutoshakemusUrl muutoshakemus-url)))))

(defn- get-muutoshakemukset []
  (compojure-api/GET "/:avustushaku-id/hakemus/:hakemus-id/muutoshakemus/" [hakemus-id]
                     :path-params [hakemus-id :- Long]
                     :return  va-schema/MuutoshakemusList
                     :summary "Get muutoshakemukset"
                     (ok (virkailija-db/get-muutoshakemukset hakemus-id))))

(defn- get-hakemus-and-its-published-avustushaku [avustushaku-id hakemus-id]
  (let [{:keys [avustushaku] :as hakemus-and-avustushaku} (get-hakemus-and-its-avustushaku avustushaku-id hakemus-id)]
    (if (= "published" (:status avustushaku))
      hakemus-and-avustushaku
      (method-not-allowed!))))

(compojure-api/defroutes healthcheck-routes
                         "Healthcheck routes"

                         (compojure-api/GET "/" [] (on-healthcheck))

                         (compojure-api/HEAD "/" [] (on-healthcheck))

                         (compojure-api/GET
                          "/integrations/" []
                          :summary "Integrations healthcheck"
                          :return virkailija-schema/HealthCheckResult
                          (on-integration-healthcheck)))

(compojure-api/defroutes resource-routes
                         (compojure-api/GET "/translations.json" []
                                            :summary "Translated messages (localization)"
                                            (va-routes/get-translations))

                         (compojure-api/undocumented
                          (compojure/GET "/" [] (return-html "virkailija/index.html"))

                          (compojure/GET "/admin/*" [] (return-html "virkailija/admin.html"))

                          (compojure/GET "/yhteenveto/*" [] (return-html "virkailija/summary.html"))

                          (compojure-api/GET "/hakemus-preview/:avustushaku-id/:hakemus-user-key" []
                                             :path-params [avustushaku-id :- Long, hakemus-user-key :- s/Str]
                                             :query-params [{decision-version :- s/Bool false}]
                                             (on-hakemus-preview avustushaku-id hakemus-user-key decision-version))

                          (compojure-api/GET "/hakemus-edit/:avustushaku-id/:hakemus-user-key" request
                                             :path-params [avustushaku-id :- Long, hakemus-user-key :- s/Str]
                                             (on-hakemus-edit avustushaku-id hakemus-user-key (authentication/get-request-identity request)))

                          (compojure-api/GET "/public/paatos/avustushaku/:avustushaku-id/hakemus/:user-key" []
                                             :path-params [avustushaku-id :- Long, user-key :- s/Str]
                                             (on-paatos-preview avustushaku-id user-key))

                          (compojure-api/GET "/selvitys/avustushaku/:avustushaku-id/:selvitys-type" []
                                             :path-params [avustushaku-id :- Long, selvitys-type :- s/Str]
                                             :query-params [{hakemus :- s/Str nil},{preview :- s/Str "false"}]
                                             (on-selvitys avustushaku-id hakemus selvitys-type preview))

                          (compojure/GET "/avustushaku/:id/*" [id] (return-html "virkailija/index.html"))

                          (compojure/GET "/admin-ui/*" [] (return-html "admin-ui/index.html"))

                          (compojure-route/resources "/admin-ui/"
                                                     {:mime-types {"html" "text/html; charset=utf-8"}})

                          va-routes/logo-route

                          (compojure-route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})

                          (compojure-route/not-found "<p>Page not found.</p>")))

(defn- get-avustushaku-status []
  (compojure-api/GET "/" []
                     :query-params [{status :- [va-schema/HakuStatus] nil}]
                     :return [va-schema/AvustusHaku]
                     :summary "Return list of all avustushaku descriptions"
                     (if-let [response (hakija-api/list-avustushaut-by-status status)]
                       (ok response)
                       (not-found))))

(defn identity->str [{:keys [first-name surname person-oid]}]
  (str first-name " " surname " (" person-oid ")"))

(defn- put-avustushaku []
  (compojure-api/PUT "/" request
                     :body [base-haku-id-wrapper (compojure-api/describe {:baseHakuId Long} "id of avustushaku to use as base")]
                     :return va-schema/AvustusHaku
                     :summary "Copy existing avustushaku as new one by id of the existing avustushaku"
                     (log/info "User" (identity->str identity) "copies avustushaku" (:baseHakuId base-haku-id-wrapper))
                     (with-tx (fn [tx]
                       (ok (hakudata/create-new-avustushaku tx (:baseHakuId base-haku-id-wrapper) (authentication/get-request-identity request)))))))

(defn- post-avustushaku []
  (compojure-api/POST "/:avustushaku-id" []
                      :path-params [avustushaku-id :- Long]
                      :body [avustushaku (compojure-api/describe va-schema/AvustusHaku "Updated avustushaku")]
                      :return va-schema/AvustusHaku
                      :summary "Update avustushaku description"
                      (if-let [response (hakija-api/update-avustushaku avustushaku)]
                        (ok response)
                        (not-found))))

(defn- get-onko-muutoshakukelpoinen-avustushaku-ok []
  (compojure-api/GET "/:avustushaku-id/onko-muutoshakukelpoinen-avustushaku-ok" []
                     :path-params [avustushaku-id :- Long]
                     :return virkailija-schema/OnkoMuutoshakukelpoinenAvustushakuOk
                     :summary "Juuh"
                     (ok (virkailija-db/onko-muutoshakukelpoinen-avustushaku-ok avustushaku-id))))

(defn- get-avustushaku []
  (compojure-api/GET "/:avustushaku-id" request
                     :path-params [avustushaku-id :- Long]
                     :return virkailija-schema/HakuData
                     :summary "Return all relevant avustushaku data (including answers, comments, form and current user privileges)"
                     (let [identity (authentication/get-request-identity request)]
                       (if-let [response (hakudata/get-combined-avustushaku-data-with-privileges avustushaku-id identity)]
                         (ok response)
                         (not-found)))))

(defn get-emails [hakemus-id email-type]
  (log/info (str "Fetching emails for hakemus with id: " hakemus-id))
  (let [emails (query "SELECT formatted, to_address, bcc, subject FROM virkailija.email
                       JOIN email_event ON (email.id = email_event.email_id)
                       WHERE hakemus_id = ? AND email_type = ?::email_type"
                      [hakemus-id email-type])]
    (log/info (str "Succesfully fetched email for hakemus with hakemus-id: " hakemus-id))
    emails))

(defn get-avustushaku-emails [avustushaku-id email-type]
  (log/info (str "Fetching emails for avustushaku with id: " avustushaku-id))
  (let [emails (query "SELECT formatted, to_address, bcc, subject FROM virkailija.email
                       JOIN email_event ON (email.id = email_event.email_id)
                       WHERE avustushaku_id = ? AND email_type = ?::virkailija.email_type"
                       [avustushaku-id email-type])]
    (log/info (str "Succesfully fetched emails for avustushaku with id: " avustushaku-id))
    emails))

(defn get-emails-by-type [type]
  (query "SELECT formatted, to_address, bcc, subject FROM virkailija.email
          JOIN email_event ON (email.id = email_event.email_id)
          WHERE email_type = ?::virkailija.email_type
          ORDER BY virkailija.email.id"
          [type]))

(defn- get-normalized-hakemus []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/normalized" [haku-id hakemus-id]
    :path-params [haku-id :- Long hakemus-id :- Long]
    :return  va-schema/NormalizedHakemus
    :summary "Get normalized answers"
    (if-let [normalized-hakemus (virkailija-db/get-normalized-hakemus hakemus-id)]
      (ok normalized-hakemus)
      (not-found)
      )))


(defn- get-selvitys []
  (compojure-api/GET "/:avustushaku-id/hakemus/:hakemus-id/selvitys" request
                     :path-params [hakemus-id :- Long avustushaku-id :- Long]
                     :return s/Any
                     :summary "Return all relevant selvitys data including answers, form and attachments"
                     (if-let [response (hakija-api/get-selvitysdata avustushaku-id hakemus-id)]
                       (ok response)
                       (not-found))))

(defn- verify-loppuselvitys-information []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/loppuselvitys/verify-information" request
                      :path-params [avustushaku-id :- Long hakemus-id :- Long]
                      :body [verify-information {:message s/Str}]
                      :return s/Any
                      :summary "Set loppuselvitys information verified"
                      (let [identity (authentication/get-request-identity request)
                            response (hakija-api/verify-loppuselvitys-information hakemus-id verify-information identity)]
                        (if response
                          (ok response)
                          (bad-request!)))))

(defn- send-selvitys []
  (compojure-api/POST "/:avustushaku-id/selvitys/:selvitys-type/send" []
                      :path-params [avustushaku-id :- Long selvitys-type :- s/Str]
                      :body [selvitys-email (compojure-api/describe virkailija-schema/SelvitysEmail "Selvitys email")]
                      :return s/Any
                      :summary "Send selvitys and update state to sent"
                      (if (hakija-api/set-selvitys-accepted selvitys-type selvitys-email)
                        (ok {:status "ok"})
                        (bad-request!))))

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
  (compojure-api/POST "/:avustushaku-id/change-request-email" []
                      :path-params [avustushaku-id :- Long]
                      :body [change-request (compojure-api/describe virkailija-schema/ChangeRequestEmail "Change request")]
                      (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
                            avustushaku-name (-> avustushaku :content :name :fi)
                            change-request (:text change-request)]
                        (ok {:mail (email/mail-example
                                    :change-request {:avustushaku avustushaku-name
                                                     :change-request change-request
                                                     :url "[linkki hakemukseen]"})}))))

(defn- get-avustushaku-export []
  (compojure-api/GET "/:haku-id/export.xslx" []
                     :path-params [haku-id :- Long]
                     :summary "Export Excel XLSX document for avustushaku"
                     (let [document (-> (hakudata/get-hakudata-for-export haku-id)
                                        export/export-avustushaku
                                        (ByteArrayInputStream.))]
                       (-> (ok document)
                           (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
                           (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"avustushaku-" haku-id ".xlsx\""))))))

(defn- get-avustushaku-role []
  (compojure-api/GET "/:avustushaku-id/role" []
                     :path-params [avustushaku-id :- Long]
                     :return [virkailija-schema/Role]
                     :summary "List roles for given avustushaku"
                     (if-let [response (hakija-api/get-avustushaku-roles avustushaku-id)]
                       (ok response)
                       (not-found))))

(defn- put-avustushaku-role []
  (compojure-api/PUT "/:avustushaku-id/role" []
                     :path-params [avustushaku-id :- Long]
                     :body [new-role (compojure-api/describe virkailija-schema/NewRole "New role to add to avustushaku")]
                     :return virkailija-schema/Role
                     :summary "Create new role for avustushaku"
                     (with-tx (fn [tx]
                       (ok (hakija-api/create-avustushaku-role tx
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
                      (ok (hakija-api/update-avustushaku-role avustushaku-id role))))

(defn- del-avustushaku-role []
  (compojure-api/DELETE "/:avustushaku-id/role/:role-id" []
                        :path-params [avustushaku-id :- Long role-id :- Long]
                        :return {:id Long}
                        :summary "Delete avustushaku role"
                        (hakija-api/delete-avustushaku-role avustushaku-id role-id)
                        (ok {:id role-id})))

(defn- get-avustushaku-privileges []
  (compojure-api/GET "/:avustushaku-id/privileges" request
                     :path-params [avustushaku-id :- Long]
                     :return virkailija-schema/HakuPrivileges
                     :summary "Show current user privileges for given avustushaku"
                     (let [user-identity   (authentication/get-request-identity request)
                           user-haku-role  (hakija-api/get-avustushaku-role-by-avustushaku-id-and-person-oid avustushaku-id (:person-oid user-identity))
                           user-privileges (authorization/resolve-user-privileges user-identity user-haku-role)]
                       (if user-privileges
                         (ok user-privileges)
                         (not-found)))))

(defn- get-avustushaku-form []
  (compojure-api/GET "/:avustushaku-id/form" []
                     :path-params [avustushaku-id :- Long]
                     :return form-schema/Form
                     :summary "Get form description that is linked to avustushaku"
                     (if-let [found-form (hakija-api/get-form-by-avustushaku avustushaku-id)]
                       (ok (without-id found-form))
                       (not-found))))

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
                              (ok (without-id response))
                              (not-found)))
                        (method-not-allowed!))))

(defn- post-hakemus-arvio []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/arvio" request
                      :path-params [avustushaku-id :- Long hakemus-id :- Long]
                      :body [arvio (compojure-api/describe virkailija-schema/Arvio "New arvio")]
                      :return virkailija-schema/Arvio
                      :summary "Update arvio for given hakemus. Creates arvio if missing."
                      (if-let [avustushaku (hakija-api/get-avustushaku avustushaku-id)]
                        (let [identity (authentication/get-request-identity request)]
                          (ok (-> (virkailija-db/update-or-create-hakemus-arvio avustushaku hakemus-id arvio identity)
                                  hakudata/arvio-json)))
                        (not-found))))

(defn- get-hakemus-comments []
  (compojure-api/GET "/:avustushaku-id/hakemus/:hakemus-id/comments" []
                     :path-params [avustushaku-id :- Long, hakemus-id :- Long]
                     :return virkailija-schema/Comments
                     :summary "Get current comments for hakemus"
                     (ok (virkailija-db/list-comments hakemus-id))))

(defn- post-hakemus-comments []
  (compojure-api/POST "/:avustushaku-id/hakemus/:hakemus-id/comments" request
                      :path-params [avustushaku-id :- Long, hakemus-id :- Long]
                      :body [comment (compojure-api/describe virkailija-schema/NewComment "New comment")]
                      :return virkailija-schema/Comments
                      :summary "Add a comment for hakemus. As response, return all comments"
                      (let [identity (authentication/get-request-identity request)
                            _avustushaku_and_hakemus_exists? (get-hakemus-and-its-published-avustushaku avustushaku-id hakemus-id)]
                        (ok (virkailija-db/add-comment hakemus-id
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
                     (ok (-> (hakija-api/list-attachments hakemus-id)
                             (hakija-api/attachments->map)))))

(defn- get-hakemus-attachments-versions []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/attachments/versions" []
                     :path-params [haku-id :- Long, hakemus-id :- Long]
                     :return [va-schema/Attachment]
                     :summary "List all versions of attachments of given hakemus"
                     :description "Listing does not return actual attachment data. Use per-field versioned download URL for getting it."
                     (ok (->> (hakija-api/list-attachment-versions hakemus-id)
                              (map hakija-api/convert-attachment)))))

(defn- get-hakemus-attachment []
  (compojure-api/GET "/:haku-id/hakemus/:hakemus-id/attachments/:field-id" []
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
                            (if loppuselvitys
                              (hakija-api/update-avustushaku-form-loppuselvitys avustushaku-id form-id)
                              (hakija-api/update-avustushaku-form-valiselvitys avustushaku-id form-id))
                            (ok (without-id created-form)))
                          (let [found-form (hakija-api/get-form-by-id form-keyword-value)]
                            (ok (without-id found-form)))))))

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
                        (ok (without-id response)))))

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
                       (ok (scoring/get-arvio-scores avustushaku-id (:id arvio)))
                       (ok {:scoring nil
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
                        (ok (scoring/add-score avustushaku-id
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
                          (ok ""))))

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
                          (method-not-allowed!))
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
                          (ok {:hakemus-id hakemus-id
                               :status new-status})))))

(defn- put-searches []
  (compojure-api/PUT "/:avustushaku-id/searches" request
                     :path-params [avustushaku-id :- Long]
                     :body [body (compojure-api/describe virkailija-schema/SavedSearch "New stored search")]
                     :return {:search-url s/Str}
                     :summary "Create new stored search"
                     :description "Stored search captures the ids of selection, and provide a stable view to hakemus data."
                     (let [identity (authentication/get-request-identity request)
                           search-id (create-or-get-search avustushaku-id body identity)
                           search-url (str "/yhteenveto/avustushaku/" avustushaku-id "/listaus/" search-id "/")]
                       (ok {:search-url search-url}))))

(defn- get-search []
  (compojure-api/GET "/:avustushaku-id/searches/:saved-search-id" []
                     :path-params [avustushaku-id :- Long, saved-search-id :- Long]
                     :return virkailija-schema/SavedSearch
                     :summary "Get stored search"
                     :description "Stored search captures the ids of selection, and provide a stable view to hakemus data."
                     (let [saved-search (get-saved-search avustushaku-id saved-search-id)]
                       (ok (:query saved-search)))))

(defn- get-tapahtumaloki []
  (compojure-api/GET "/:avustushaku-id/tapahtumaloki/:tyyppi" []
                     :path-params [avustushaku-id :- Long, tyyppi :- s/Str]
                     (ok (tapahtumaloki/get-tapahtumaloki-entries tyyppi avustushaku-id))))

(compojure-api/defroutes test-api-routes
  (compojure-api/POST "/set-fake-identity/:identity" []
    :path-params [identity :- s/Str]
    (cond (= identity "valtionavustus") (authentication/set-fake-identity authentication/default-fake-admin-identity)
          (= identity "paivipaakayttaja") (authentication/set-fake-identity authentication/fake-identity-paivi-paakayttaja)
          (= identity "viivivirkailija") (authentication/set-fake-identity authentication/fake-identity-viivi-virkailija)
          :else (throw (RuntimeException. (str "Invalid fake identity '" identity "'"))))
    (ok {:ok "ok"}))


  (compojure-api/POST "/send-loppuselvitys-asiatarkastamatta-notifications" []
    :return {:ok s/Str}
    (virkailija-notifications/send-loppuselvitys-asiatarkastamatta-notifications)
    (ok {:ok "ok"}))

  (compojure-api/POST "/process-maksupalaute" []
    :body  [body { :xml s/Str :filename s/Str }]
    :return {:message s/Str}
    (log/info "test-api: put maksupalaute xml to maksatuspalvelu and process it")
    (try
      (put-maksupalaute-to-maksatuspalvelu (:filename body) (:xml body))
      (processMaksupalaute)
      (ok {:message "SUCCESS"})
      (catch Exception e
        (log/error e)
        (internal-server-error {:message "error"}))))

  (compojure-api/GET "/get-sent-maksatukset" []
    :return {:maksatukset [s/Str]}
    (log/info "test-api: get all maksatukset we have sent to maksatuspalvelu")
    (try
      (let [rondo-service (rondo-service/create-service
                            (get-in config [:server :payment-service-sftp]))]
        (ok {:maksatukset (get-all-maksatukset-from-maksatuspalvelu rondo-service)})
      )
      (catch Exception e
        (log/error e)
        (internal-server-error {:message "error"}))))

  (compojure-api/POST "/remove-stored-pitkaviite-from-all-avustushaku-payments" []
    :body  [body { :avustushakuId s/Num }]
    :return {:message s/Str}
    (log/info "test-api: Removing stored pitkäviite from all payments on avustushaku " (:avustushakuId body))
    (try
      (execute! "UPDATE payments
                 SET pitkaviite = null
                 FROM hakemukset
                 WHERE
                   hakemukset.avustushaku = ?
                   AND payments.application_id = hakemukset.id
                   AND payments.application_version = hakemukset.version"
                [(:avustushakuId body)])
      (ok {:message "SUCCESS"})
      (catch Exception e
        (log/error e)
        (internal-server-error {:message "error"}))))

  (compojure-api/POST "/avustushaku/:avustushaku-id/set-muutoshakukelpoisuus" []
    :path-params [avustushaku-id :- Long]
    :body  [body (compojure-api/describe { :muutoshakukelpoinen s/Bool } "Juuh")]
    :return va-schema/AvustusHaku
    (log/info "Setting avustushaku" avustushaku-id "muutoshakukelpoisuus to" (:muutoshakukelpoinen body))
    (if-let [avustushaku (hakija-api/get-avustushaku avustushaku-id)]
      (ok (-> avustushaku
              (va-routes/avustushaku-response-content)
              (assoc :muutoshakukelpoinen (:muutoshakukelpoinen body))
              (hakija-api/update-avustushaku)))
      (not-found)))

  (compojure-api/GET "/hakemus/:hakemus-id/token-and-register-number" []
    :path-params [hakemus-id :- Long]
    :return { :token s/Str :register-number s/Str }
    (let [sql "SELECT (SELECT register_number FROM hakemukset WHERE version_closed IS null AND id = ?),
                      (SELECT token FROM application_tokens WHERE application_id = ?)"]
      (if-some [row (first (query sql [hakemus-id hakemus-id]))]
        (ok row)
        (not-found))))

  (compojure-api/POST "/user-cache" []
    :body  [body (compojure-api/describe virkailija-schema/PopulateUserCachePayload "Juuh")]
    :return s/Any
    :summary "Juuh"
    (ok (virkailija-db/update-va-users-cache body)))

  (compojure-api/GET "/email/:email-type" []
    :path-params [email-type :- s/Str]
    :return virkailija-schema/DbEmails
    :summary "Return emails of the given type"
    (ok (get-emails-by-type email-type)))

  (compojure-api/GET "/hakemus/:hakemus-id/email/:email-type" []
    :path-params [hakemus-id :- Long email-type :- s/Str]
    :return virkailija-schema/DbEmails
    :summary "Return emails related to the hakemus"
    (ok (get-emails hakemus-id email-type)))

  (compojure-api/GET "/avustushaku/:avustushaku-id/email/:email-type" []
    :path-params [avustushaku-id :- Long email-type :- s/Str]
    :return virkailija-schema/DbEmails
    :summary "Return emails related to the avustushaku"
    (ok (get-avustushaku-emails avustushaku-id email-type))))

(compojure-api/defroutes avustushaku-routes
                         "Hakemus listing and filtering"

                         (compojure-api/GET "/search" []
                                            :query-params [organization-name :- virkailija-schema/AvustushakuOrganizationNameQuery]
                                            :return s/Any
                                            :summary "Search hakemukset by organization name. Organization-name must have length of at least 3."
                                            (ok (hakemus-search/find-hakemukset-by-organization-name organization-name)))

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

(compojure-api/defroutes public-routes
                         "Public API"

                         (compojure-api/GET "/avustushaku/:avustushaku-id/paatokset" []
                                            :path-params [avustushaku-id :- Long]
                                            :return s/Any
                                            :summary "Get paatokset"
                                            :description "Get paatokset public info"
                                            (ok (hakudata/get-avustushaku-and-paatokset avustushaku-id)))

                         (compojure-api/GET "/avustushaku/paatos/:user-key" []
                                            :path-params [user-key :- String]
                                            :return virkailija-schema/PaatosData
                                            :summary "Return relevant information for decision"
                                            (let [hakemus (hakija-api/get-hakemus-by-user-key user-key)
                                                  hakemus-id (:id hakemus)]
                                              (if-let [response (hakudata/get-final-combined-paatos-data hakemus-id)]
                                                (-> (ok response)
                                                    (assoc-in [:headers "Access-Control-Allow-Origin"] "*"))
                                                (not-found)))))

(compojure-api/defroutes userinfo-routes
                         "User information"

                         (compojure-api/GET "/" request
                                            (ok (authentication/get-request-identity request))))

(compojure-api/defroutes va-user-routes
                         "VA users"

                         (compojure-api/POST "/search" []
                                             :body [body (compojure-api/describe {:searchInput s/Str} "User input of VA user search box")]
                                             :return virkailija-schema/VaUserSearchResults
                                             :summary "Search VA users"
                                             :description "Each search term must be found as part of user name or email, case insensitive."
                                             (let [search-input   (:searchInput body)
                                                   search-results (va-users/search-va-users search-input)]
                                               (ok {:results search-results}))))

(compojure-api/defroutes koodisto-routes
                         "Koodisto-service access"

                         (compojure-api/GET "/" []
                                            :return s/Any
                                            :summary "List the available koodisto items"
                                            :description "One of these can be selected for a Koodisto based input form field."
                                            (let [koodisto-list (koodisto/list-koodistos)]
                                              (ok koodisto-list)))

                         (compojure-api/GET "/:koodisto-uri/:version" []
                                            :path-params [koodisto-uri :- s/Str version :- Long]
                                            :return s/Any
                                            :summary "List contents of certain version of certain koodisto"
                                            :description "Choice values and labels for each value"
                                            (let [koodi-options (koodisto/get-cached-koodi-options koodisto-uri version)]
                                              (ok (:content koodi-options)))))

(compojure-api/defroutes help-texts-routes
                         "Help texts"
                         (compojure-api/GET "/all" []
                                            :return s/Any
                                            :summary "Get help texts"
                                            (ok (help-texts/find-all))))

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

(compojure-api/defroutes login-routes
                         "Authentication"

                         (compojure-api/GET "/cas" request
                                            :query-params [{ticket :- s/Str nil}]
                                            :return s/Any
                                            :summary "Handle login CAS ticket and logout callback from cas"
                                            (try
                                              (if ticket
                                                (if (authentication/authenticate ticket virkailija-login-url)
                                                  (-> (resp/redirect (url-after-login request))
                                                      (assoc :session {:cas-ticket ticket}))
                                                  (redirect-to-loggged-out-page request {"not-permitted" "true"}))
                                                (redirect-to-loggged-out-page request {}))
                                              (catch Exception e
                                                (if (and (.getMessage e) (.contains (.getMessage e) "INVALID_TICKET"))
                                                  (log/warn "Invalid ticket: " (.toString e))
                                                  (log/error "Error in login ticket handling" e))
                                                (redirect-to-loggged-out-page request {"error" "true"}))))

                         (compojure-api/POST "/cas" request
                                             :form-params [logoutRequest :- s/Str]
                                             :return s/Any
                                             :summary "Handle logout request from cas"
                                             (authentication/cas-initiated-logout logoutRequest)
                                             (-> (ok)
                                                 (assoc :session nil)))

                         (compojure-api/undocumented
                          (compojure/GET "/logout" request
                                         (if-let [cas-ticket (get-in request [:session :cas-ticket])]
                                           (authentication/user-initiated-logout cas-ticket))
                                         (-> (resp/redirect (str opintopolku-logout-url virkailija-login-url))
                                             (assoc :session nil)))

                          (compojure/GET "/logged-out" [] (return-html "virkailija/login.html")))

                         (compojure-api/GET
                          "/sessions/" [:as request]
                          :return (s/maybe s/Str)
                          :summary "Enpoint for checking if session is valid"
                          (if-let [identity (authentication/get-request-identity request)]
                            (ok "ok")
                            (unauthorized))))

(def api-config
  {:formats [:json-kw]
   :exceptions {:handlers {::compojure-ex/response-validation compojure-error-handler
                           ::compojure-ex/request-parsing compojure-error-handler
                           ::compojure-ex/request-validation compojure-error-handler
                           ::compojure-ex/default exception-handler}}
   :swagger {:ui "/doc"
             :spec "/swagger.json"
             :data {:info {:title "Valtionavustus API"}
                    :tags [{:name "avustushaku"
                            :description "Avustushaku and hakemus listing and filtering"}
                           {:name "login"
                            :description "Login and logout"}
                           {:name "userinfo"
                            :description "User information about currently logged in user"}
                           {:name "healthcheck"
                            :description "Healthcheck"}]}}})

(compojure-api/defapi all-routes
                      api-config

                      (when (get-in config [:test-apis :enabled?])
                        (compojure-api/context "/api/test" [] :tags ["test"] test-api-routes))
                      (compojure-api/context "/public/api" [] :tags ["public"] public-routes)
                      (compojure-api/context "/api/avustushaku" [] :tags ["avustushaku"] avustushaku-routes)
                      (compojure-api/context "/login" [] :tags ["login"] login-routes)
                      (compojure-api/context "/api/help-texts" [] :tags ["help-texts"] help-texts-routes)
                      (compojure-api/context "/api/userinfo" [] :tags ["userinfo"] userinfo-routes)
                      (compojure-api/context "/api/va-user" [] :tags ["va-user"] va-user-routes)
                      (compojure-api/context "/api/koodisto" [] :tags ["koodisto"] koodisto-routes)
                      (compojure-api/context "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)
                      (compojure-api/context "/api/paatos" [] :tags ["paatos"] paatos/paatos-routes)
                      (compojure-api/context "/paatos" [] :tags ["paatos"] decision/decision-routes)
                      (compojure-api/context "/api/v2/grants" [] :tags ["grants"] grant-routes/routes)
                      (compojure-api/context "/api/v2/applications" [] :tags ["applications"]
                                             application-routes/routes)
                      (compojure-api/context
                       "/api/v2/reports" [] :tags ["reports"] reporting-routes/routes)
                      (compojure-api/context "/api/v2/payment-batches" [] :tags ["payment batches"]
                                             payment-batches-routes/routes)
                      (compojure-api/context "/api/v2/va-code-values" [] :tags ["va-code-values"]
                                             va-code-values-routes/routes)
                      (compojure-api/context "/api/v2/payments" [] :tags ["payments"]
                                             payments-routes/routes)
                      (compojure-api/context "/api/v2/external" []
                                             :tags ["external"]
                                             external/routes)

                      va-routes/config-routes
                      resource-routes)
