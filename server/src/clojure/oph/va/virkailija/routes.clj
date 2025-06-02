(ns oph.va.virkailija.routes
  (:require [cemerick.url :refer [map->query]]
            [clojure.tools.logging :as log]
            [compojure.api.exception :as compojure-ex]
            [compojure.middleware :as middleware]
            [compojure.api.sweet :as compojure-api]
            [compojure.core :as compojure]
            [compojure.route :as compojure-route]
            [oph.common.email :as common-email]
            [oph.soresu.common.config :refer [config]]
            [oph.soresu.common.db :refer [query execute!]]
            [oph.soresu.common.koodisto :as koodisto]
            [oph.soresu.common.routes :refer [return-html compojure-error-handler exception-handler]]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.hakija.officer-edit-auth :as officer-edit-auth]
            [oph.va.routes :as va-routes]
            [oph.va.schema :as va-schema]
            [oph.va.virkailija.application-routes :as application-routes]
            [oph.va.virkailija.authentication :as authentication]
            [oph.va.virkailija.avustushaku-routes :refer [avustushaku-routes]]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.decision :as decision]
            [oph.va.virkailija.external :as external]
            [oph.va.virkailija.fake-authentication :as fake-authentication]
            [oph.va.virkailija.grant-routes :as grant-routes]
            [oph.va.virkailija.hakemus-routes :as hakemus-routes]
            [oph.va.virkailija.hakudata :as hakudata]
            [oph.va.virkailija.healthcheck :as healthcheck]
            [oph.va.virkailija.help-texts :as help-texts]
            [oph.va.virkailija.paatos :as paatos]
            [oph.va.virkailija.payment-batches-routes :as payment-batches-routes]
            [oph.va.virkailija.payments-routes :as payments-routes]
            [oph.va.virkailija.remote-file-service :refer [get-all-maksatukset-from-maksatuspalvelu]]
            [oph.va.virkailija.reports.routes :as reporting-routes]
            [oph.va.virkailija.maksatukset-and-tasmaytysraportti-routes :as maksatukset-and-tasmaytysraportti-routes]
            [oph.va.virkailija.rondo-scheduling :refer [processMaksupalaute put-maksupalaute-to-maksatuspalvelu]]
            [oph.va.virkailija.muistutus-scheduling :refer [send-muistutusviestit]]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.schema :as virkailija-schema]
            [oph.va.virkailija.va-code-values-routes :as va-code-values-routes]
            [oph.va.virkailija.talousarviotili-routes :as talousarviotili-routes]
            [oph.va.virkailija.va-users :as va-users]
            [oph.va.virkailija.virkailija-notifications :as virkailija-notifications]
            [ring.swagger.json-schema-dirty]                ; for schema.core/conditional
            [ring.util.http-response :refer [ok internal-server-error not-found bad-request unauthorized]]
            [ring.util.response :as response]
            [ring.util.response :as resp]
            [ring.util.codec :as codec]
            [schema.core :as s]))

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
  (log/info "virkailija healthcheck")
  (if (virkailija-db/health-check)
    (ok {})
    (not-found)))

(defn- on-integration-healthcheck []
  (ok (healthcheck/get-last-status)))

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

(defn- on-hakemus-edit [avustushaku-id hakemus-user-key]
  (let [hakemus (hakija-api/get-hakemus-by-user-key hakemus-user-key)
        language (keyword (:language hakemus))
        hakija-app-url (-> config :server :url language)
        token (officer-edit-auth/generate-token (:id hakemus))]
    (resp/redirect (str hakija-app-url "avustushaku/" avustushaku-id "/nayta?hakemus=" hakemus-user-key "&officerToken=" token))))

(defn- on-paatos-preview [avustushaku-id user-key]
  (let [hakemus (hakija-api/get-hakemus-by-user-key user-key)
        language (keyword (:language hakemus))
        hakija-app-url (-> config :server :url language)
        preview-url (str hakija-app-url "paatos/avustushaku/" avustushaku-id "/hakemus/" user-key "?nolog=true")]
    (resp/redirect preview-url)))

(defn wait-handler
  "Blocks for `ms` milliseconds and then returns a response."
  [request]
  (let [ms (or (some-> (:query-params request) (get "ms") Integer/parseInt) 1000)]
    (Thread/sleep ms)
    (response/response {:status "ok" :waited-ms ms})))

(defn- on-selvitys [avustushaku-id hakemus-user-key selvitys-type showPreview]
  (let [hakemus (hakija-api/get-hakemus-by-user-key hakemus-user-key)
        language (keyword (:language hakemus))
        hakija-app-url (-> config :server :url language)
        preview-url (str hakija-app-url "avustushaku/" avustushaku-id "/" selvitys-type "?hakemus=" hakemus-user-key "&preview=" showPreview)]
    (resp/redirect preview-url)))

(compojure-api/defroutes healthcheck-routes
  "Healthcheck routes"

  (compojure-api/GET "/" [] (on-healthcheck))

  (compojure-api/HEAD "/" [] (on-healthcheck))

  (compojure-api/POST "/csp-report" request
    (log/info "CSP:" (slurp (:body request)))
    (ok {:ok "ok"}))

  (compojure-api/GET "/wait" [] wait-handler)

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
   (middleware/wrap-canonical-redirect (compojure/GET "/avustushaku" [id] (return-html "virkailija/index.html")))
   (compojure/GET "/avustushaku/:id" [id] (return-html "virkailija/index.html"))
   (compojure/GET "/avustushaku/:id/*" [id] (return-html "virkailija/index.html"))

   (middleware/wrap-canonical-redirect (compojure/GET "/admin" [id] (return-html "virkailija/admin.html")))
   (compojure/GET "/admin/*" [] (return-html "virkailija/admin.html"))

   (compojure/GET "/yhteenveto/*" [] (return-html "virkailija/summary.html"))

   (compojure/GET "/haku/*" [] (return-html "virkailija/search.html"))

   (compojure-api/GET "/hakemus-preview/:avustushaku-id/:hakemus-user-key" []
     :path-params [avustushaku-id :- Long, hakemus-user-key :- s/Str]
     :query-params [{decision-version :- s/Bool false}]
     (on-hakemus-preview avustushaku-id hakemus-user-key decision-version))

   (compojure-api/GET "/hakemus-edit/:avustushaku-id/:hakemus-user-key" request
     :path-params [avustushaku-id :- Long, hakemus-user-key :- s/Str]
     (on-hakemus-edit avustushaku-id hakemus-user-key))

   (compojure-api/GET "/public/paatos/avustushaku/:avustushaku-id/hakemus/:user-key" []
     :path-params [avustushaku-id :- Long, user-key :- s/Str]
     (on-paatos-preview avustushaku-id user-key))

   (compojure-api/GET "/selvitys/avustushaku/:avustushaku-id/:selvitys-type" []
     :path-params [avustushaku-id :- Long, selvitys-type :- s/Str]
     :query-params [{hakemus :- s/Str nil},{preview :- s/Str "false"}]
     (on-selvitys avustushaku-id hakemus selvitys-type preview))

   (compojure-api/context "/admin-ui/va-code-values" []
     (compojure-api/GET "*" request
       (va-code-values-routes/with-admin request
         (return-html "virkailija/codevalues.html")
         (resp/status (return-html "virkailija/unauthorized.html") 401))))

   (compojure-api/GET "/admin-ui/search/" [search order]
     (if (:and search order)
       (resp/redirect (str "/haku/" "?" (codec/form-encode {:search search :order order})))
       (resp/redirect "/haku/")))

   va-routes/logo-route

   (compojure-route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})

   (compojure-route/not-found "<p>Page not found.</p>")))

(defn get-emails-for-email-type [email-type]
  (log/info (str "Fetching emails for email type: " email-type))
  (let [emails (query "SELECT email.id, formatted, to_address, bcc, cc, subject, reply_to, from_address FROM virkailija.email
                       JOIN email_event ON (email.id = email_event.email_id)
                       WHERE email_type = ?::email_type
                       ORDER BY email.created_at DESC"
                      [email-type])]
    (log/info (str "Succesfully fetched emails for email type: " email-type))
    emails))

(defn get-email-attachment-for-email-id [id]
  (log/info (str "Fetching email attachment for email id: " id))
  (let [emails (query "SELECT attachment_contents, attachment_title, attachment_description FROM virkailija.email
                       JOIN email_event ON (email.id = email_event.email_id)
                       WHERE email.id = ?"
                      [id])
        email (first emails)]
    (log/info (str "Succesfully fetched email attachment for email id: " id))
    email))

(defn get-emails [hakemus-id email-type]
  (log/info (str "Fetching emails for hakemus with id: " hakemus-id))
  (let [emails (query "SELECT email.id, formatted, to_address, bcc, cc, subject, reply_to, from_address FROM virkailija.email
                       JOIN email_event ON (email.id = email_event.email_id)
                       WHERE hakemus_id = ? AND email_type = ?::email_type"
                      [hakemus-id email-type])]
    (log/info (str "Succesfully fetched email for hakemus with hakemus-id: " hakemus-id))
    emails))

(defn get-avustushaku-emails [avustushaku-id email-type]
  (log/info (str "Fetching emails for avustushaku with id: " avustushaku-id))
  (let [emails (query "SELECT email.id, formatted, from_address, to_address, bcc, cc, subject FROM virkailija.email
                       JOIN email_event ON (email.id = email_event.email_id)
                       WHERE avustushaku_id = ? AND email_type = ?::virkailija.email_type"
                      [avustushaku-id email-type])]
    (log/info (str "Succesfully fetched emails for avustushaku with id: " avustushaku-id))
    emails))

(defn get-emails-by-send-success [success?]
  (let [rows (query "SELECT * FROM (
                       SELECT DISTINCT ON (e.id) e.id, e.formatted, e.to_address, e.bcc, e.cc, e.subject, ee.success
                       FROM virkailija.email e
                       JOIN email_event ee ON (e.id = ee.email_id)
                       ORDER BY e.id, ee.created_at DESC
                     ) AS r
                     WHERE r.success = ?" [success?])]
    (map (fn [row] (select-keys row [:id :formatted :to-address :bcc :cc :subject])) rows)))

(defn get-emails-that-failed-to-be-sent []
  (get-emails-by-send-success false))

(defn get-emails-that-succeeded-to-be-sent []
  (get-emails-by-send-success true))

(defn generate-emails-that-failed-to-be-sent [count]
  (let [msg {:from "f@domain" :sender "s" :to ["t@domain"] :subject "s" :email-type "paatos" :lang "l"}
        ids (map (fn [_] (common-email/store-email msg "m")) (range count))]
    (doseq [id ids]
      (common-email/create-email-event id false msg))
    ids))

(defn delete-generated-emails-and-events []
  (execute! "
    WITH removable_emails AS (
      DELETE FROM virkailija.email_event
      WHERE email_id IN (
        SELECT id FROM virkailija.email WHERE sender = 's'
      )
      RETURNING virkailija.email_event.email_id
    )
    DELETE FROM virkailija.email WHERE id IN (
      SELECT email_id FROM removable_emails
    )
  " []))

(compojure-api/defroutes test-api-routes
  (compojure-api/POST "/set-fake-identity/:identity" []
    :path-params [identity :- s/Str]
    (if (fake-authentication/valid-fake-identity? identity)
      (-> (ok {:ok "ok"})
          (assoc :session {:fake-identity identity}))
      (bad-request "Invalid fake identity")))

  (compojure-api/POST "/csp-report-uri" []
    :body [body s/Any]
    :return {:ok s/Str}
    (log/info "csp report" (:source-file (:csp-report body)))
    (ok {:ok "ok"}))

  (compojure-api/POST "/send-loppuselvitys-asiatarkastamatta-notifications" []
    :return {:ok s/Str}
    (virkailija-notifications/send-loppuselvitys-asiatarkastamatta-notifications)
    (ok {:ok "ok"}))

  (compojure-api/POST "/send-hakuaika-paattymassa-notifications" []
    :return {:ok s/Str}
    (log/info "test-api: send hakuaika paattymassa notifications")
    (virkailija-notifications/send-hakuaika-paattymassa-notifications)
    (ok {:ok "ok"}))

  (compojure-api/POST "/send-hakuaika-paattynyt-notifications" []
    :return {:ok s/Str}
    (log/info "test-api: send hakuaika päättynyt notifications")
    (virkailija-notifications/send-hakuaika-paattynyt-notifications)
    (ok {:ok "ok"}))

  (compojure-api/POST "/send-loppuselvitys-palauttamatta-notifications" []
    :return {:ok s/Str}
    (log/info "test-api: send loppuselvitys palauttamatta notifications")
    (virkailija-notifications/send-loppuselvitys-palauttamatta-notifications)
    (ok {:ok "ok"}))

  (compojure-api/POST "/send-laheta-valiselvityspyynnot-notifications" []
    :return {:ok s/Str}
    (log/info "test-api: send laheta valiselvityspyynnot notifications")
    (virkailija-notifications/send-laheta-valiselvityspyynnot-notifications)
    (ok {:ok "ok"}))

  (compojure-api/POST "/send-laheta-loppuselvityspyynnot-notifications" []
    :return {:ok s/Str}
    (log/info "test-api: send laheta loppuselvityspyynnot notifications")
    (virkailija-notifications/send-laheta-loppuselvityspyynnot-notifications)
    (ok {:ok "ok"}))

  (compojure-api/POST "/send-valiselvitys-palauttamatta-notifications" []
    :return {:ok s/Str}
    (log/info "test-api: send valiselvitys palauttamatta notifications")
    (virkailija-notifications/send-valiselvitys-palauttamatta-notifications)
    (ok {:ok "ok"}))

  (compojure-api/POST "/trigger-raportointivelvoite-muistustus" []
    :return {:ok s/Str}
    (log/info "test-api: trigger raportointivelvoite muistustus")
    (send-muistutusviestit)
    (ok {:ok "ok"}))

  (compojure-api/POST "/send-muutoshakemuksia-kasittelematta-notifications" []
    :return {:ok s/Str}
    (virkailija-notifications/send-muutoshakemuksia-kasittelematta-notifications)
    (ok {:ok "ok"}))

  (compojure-api/POST "/process-maksupalaute" []
    :body  [body {:xml s/Str :filename s/Str}]
    :return {:message s/Str}
    (log/info "test-api: put maksupalaute xml to maksatuspalvelu and process it")
    (try
      (put-maksupalaute-to-maksatuspalvelu (:filename body) (:xml body))
      (processMaksupalaute)
      (ok {:message "SUCCESS"})
      (catch Exception e
        (log/error e)
        (internal-server-error {:message "error"}))))

  (compojure-api/POST "/get-sent-invoice-from-db" []
    :body  [body {:pitkaviite s/Str}]
    (let [sql "SELECT outgoing_invoice::text AS invoice FROM virkailija.payments
               WHERE paymentstatus_id = 'sent' AND pitkaviite = ?"]
      (if-some [row (first (query sql [(:pitkaviite body)]))]
        (-> (ok (:invoice row))
            (assoc-in [:headers "Content-Type"] "text/xml"))
        (not-found))))

  (compojure-api/GET "/get-sent-maksatukset" []
    :return {:maksatukset [s/Str]}
    (log/info "test-api: get all maksatukset we have sent to maksatuspalvelu")
    (try
      (let [rondo-service (rondo-service/create-service
                           (get-in config [:server :payment-service-sftp]))]
        (ok {:maksatukset (get-all-maksatukset-from-maksatuspalvelu rondo-service)}))
      (catch Exception e
        (log/error e)
        (internal-server-error {:message "error"}))))

  (compojure-api/POST "/set-excel-tasmaytysraportti-payment-date" []
    :body  [body {:pitkaviite s/Str}]
    (try
      (let [result (first (query "
        WITH updated AS (
          UPDATE virkailija.payments
          SET created_at = NOW() - INTERVAL '1 month'
          WHERE pitkaviite = ?
          AND paymentstatus_id = 'sent'
          RETURNING 1
        )
        SELECT COUNT(*) AS amount
        FROM updated", [(:pitkaviite body)]))]
        (if (= 1 (:amount result))
          (ok {:ok "ok"})
          (bad-request (str "Timestamps updated: " (:amount result)))))
      (catch Exception e
        (log/error e)
        (internal-server-error {:message "error"}))))

  (compojure-api/GET "/send-excel-tasmaytysraportti" []
    :summary "Täsmäytysraportti Excel XLSX document for last months payments"
    (log/info "Test API: Send kuukausittainen tasmaytysraportti email")
    (try
      (virkailija-notifications/send-kuukausittainen-tasmaytysraportti {:force true})
      (ok {:ok "ok"})
      (catch Exception e
        (log/error e)
        (internal-server-error {:message "error"}))))

  (compojure-api/GET "/avustushaku/:avustushaku-id/get-menoluokat" []
    :path-params [avustushaku-id :- Long]
    :return [{:id s/Num :avustushaku-id s/Num :type s/Str :translation-fi s/Str :translation-sv s/Str :created-at java.sql.Timestamp}]
    (log/info "test-api: get menoluokat for avustushaku-id")
    (try
      (ok (query "SELECT * FROM menoluokka WHERE avustushaku_id = ?" [avustushaku-id]))
      (catch Exception e
        (log/error e)
        (internal-server-error {:message "error"}))))

  (compojure-api/GET "/avustushaku/:avustushaku-id/get-tasmaytysraportti-email" []
    :path-params [avustushaku-id :- Long]
    :return [{:avustushaku-id s/Num :contents s/Any :mailed-at java.sql.Timestamp :mailed-to s/Str}]
    (log/info "test-api: get tasmaytysraporti for avustushaku-id")
    (try
      (ok (query "SELECT avustushaku_id, contents, mailed_at, mailed_to FROM tasmaytysraportti WHERE avustushaku_id = ?" [avustushaku-id]))
      (catch Exception e
        (log/error e)
        (internal-server-error {:message "error"}))))

  (compojure-api/POST "/remove-stored-pitkaviite-from-all-avustushaku-payments" []
    :body  [body {:avustushakuId s/Num}]
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
    :body  [body (compojure-api/describe {:muutoshakukelpoinen s/Bool} "Juuh")]
    :return va-schema/AvustusHaku
    (log/info "Setting avustushaku" avustushaku-id "muutoshakukelpoisuus to" (:muutoshakukelpoinen body))
    (if-let [avustushaku (hakija-api/get-avustushaku avustushaku-id)]
      (ok (-> avustushaku
              (va-routes/avustushaku-response-content)
              (assoc :muutoshakukelpoinen (:muutoshakukelpoinen body))
              (hakija-api/update-avustushaku)))
      (not-found)))

  (compojure-api/POST "/add-migrated-talousarviotili" []
    :body [body (compojure-api/describe {:talousarviotili s/Str} "Talousarviotili")]
    :return {:ok s/Str}
    (log/info "Adding migrated talousarviotili %s" (:talousarviotili body))
    (let [sql "INSERT INTO virkailija.talousarviotilit (code, migrated_from_not_normalized_ta_tili) VALUES (?, true)"]
      (execute! sql [(:talousarviotili body)])
      (ok {:message "SUCCESS"})))

  (compojure-api/GET "/hakemus/:hakemus-id/token-and-register-number" []
    :path-params [hakemus-id :- Long]
    :return {:token s/Str :register-number s/Str}
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

  (compojure-api/GET "/email/:email-id/attachment/excel" []
    :path-params [email-id :- s/Num]
    (log/info "Test API: Getting email excel attachment")
    (try
      (let [attachment (get-email-attachment-for-email-id email-id)
            document (:attachment-contents attachment)
            title (:attachment-title attachment)]
        (-> (ok document)
            (assoc-in [:headers "Content-Type"] "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml")
            (assoc-in [:headers "Content-Disposition"] (str "inline; filename=\"" title "\""))))
      (catch Exception e
        (log/error e)
        (internal-server-error {:message "error"}))))

  (compojure-api/GET "/email/sent/failed" []
    :return virkailija-schema/DbEmails
    :summary "Return emails that failed to be send"
    (ok (get-emails-that-failed-to-be-sent)))

  (compojure-api/GET "/email/sent/succeeded" []
    :return virkailija-schema/DbEmails
    :summary "Return emails that succeeded to be send"
    (ok (get-emails-that-succeeded-to-be-sent)))

  (compojure-api/POST "/email/generate-emails-that-failed-to-be-sent" []
    :body [body {:count s/Num}]
    :return [s/Num]
    :summary "Generate emails that failed to be sent and return ids"
    (ok (generate-emails-that-failed-to-be-sent (:count body))))

  (compojure-api/POST "/email/delete-generated-emails-and-events" []
    :summary "Delete all emails and events that were generated from generate-emails-that-failed-to-be-sent"
    (ok (delete-generated-emails-and-events)))

  (compojure-api/POST "/email/retry-to-send-email" []
    :summary "Retry to send failed email"
    (ok (common-email/retry-sending-failed-emails)))

  (compojure-api/GET "/hakemus/:hakemus-id/email/:email-type" []
    :path-params [hakemus-id :- Long email-type :- s/Str]
    :return virkailija-schema/DbEmails
    :summary "Return emails related to the hakemus"
    (ok (get-emails hakemus-id email-type)))

  (compojure-api/GET "/avustushaku/:avustushaku-id/email/:email-type" []
    :path-params [avustushaku-id :- Long email-type :- s/Str]
    :return virkailija-schema/DbEmails
    :summary "Return emails related to the avustushaku"
    (ok (get-avustushaku-emails avustushaku-id email-type)))

  (compojure-api/GET "/email/:email-type" []
    :path-params [email-type :- s/Str]
    :return virkailija-schema/DbEmails
    :summary "Return emails related to the email type"
    (log/info "Test API: Getting emails related to email type")
    (ok (get-emails-for-email-type email-type))))

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
    :return (s/pred map?)
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

  (compojure-api/POST "/cas" []
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

(compojure-api/defapi
  all-routes
  api-config

  (compojure-api/context "/login" [] :tags ["login"] login-routes)
  (compojure-api/context "/paatos" [] :tags ["paatos"] decision/decision-routes)

  (compojure-api/context "/public/api" [] :tags ["public"] public-routes)

  (when (get-in config [:test-apis :enabled?])
    (compojure-api/context "/api/test" [] :tags ["test"] test-api-routes))
  (compojure-api/context "/api/avustushaku" [] :tags ["avustushaku"] avustushaku-routes)
  (compojure-api/context "/api/avustushaku/:avustushaku-id/hakemus/:hakemus-id" []
    :tags ["hakemus"]
    hakemus-routes/hakemus-routes)
  (compojure-api/context "/api/healthcheck" [] :tags ["healthcheck"] healthcheck-routes)
  (compojure-api/context "/api/help-texts" [] :tags ["help-texts"] help-texts-routes)
  (compojure-api/context "/api/koodisto" [] :tags ["koodisto"] koodisto-routes)
  (compojure-api/context "/api/paatos" [] :tags ["paatos"] paatos/paatos-routes)
  (compojure-api/context "/api/send-maksatukset-and-tasmaytysraportti" [] :tags ["maksatukset and tasmaytysraportti"] maksatukset-and-tasmaytysraportti-routes/routes)
  (compojure-api/context "/api/talousarviotilit" [] :tags ["talousarviotilit"] talousarviotili-routes/routes)
  (compojure-api/context "/api/userinfo" [] :tags ["userinfo"] userinfo-routes)
  (compojure-api/context "/api/va-user" [] :tags ["va-user"] va-user-routes)

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
