(ns oph.va.virkailija.paatos
  (:require
   [ring.util.http-response :refer [bad-request ok]]
   [compojure.api.sweet :as compojure-api]
   [oph.va.hakija.api :as hakija-api]
   [oph.soresu.form.formutil :as formutil]
   [oph.va.decision-liitteet :as decision-liitteet]
   [oph.va.virkailija.email :as email]
   [oph.common.email :refer [legacy-email-field-ids legacy-email-field-ids-without-contact-email]]
   [oph.common.email-utils :as email-utils]
   [oph.va.virkailija.db :as virkailija-db]
   [oph.va.virkailija.saved-search :as saved-search]
   [clojure.tools.logging :as log]
   [clojure.string :as str]
   [oph.va.virkailija.decision :as decision]
   [oph.soresu.common.config :refer [config]]
   [oph.va.hakija.jotpa :refer [is-jotpa-avustushaku]]
   [oph.va.virkailija.application-data :refer [get-application-token create-application-token]]
   [oph.va.virkailija.payments-data :as payments-data]
   [oph.va.virkailija.tapahtumaloki :as tapahtumaloki]
   [oph.va.virkailija.authentication :as authentication]))

(defn is-notification-email-field? [field has-normalized-contact-email?]
  (let [email-fields (if has-normalized-contact-email?
                       legacy-email-field-ids-without-contact-email
                       legacy-email-field-ids)]
    (or
     (and (not= (:key field) "trusted-contact-email") (formutil/has-field-type? "vaEmailNotification" field))
        ;;This array is for old-style email-fields which did not yet have the :vaEmailNotification field-type
     (some #(= (:key field) %) email-fields))))

(defn- emails-from-answers [answers has-normalized-contact-email?]
  (let [email-answers (formutil/filter-values #(is-notification-email-field? % has-normalized-contact-email?) answers)
        emails (vec (remove clojure.string/blank? (distinct (map :value email-answers))))]
    emails))

(defn- emails-for-hakemus-without-signatories [hakemus contact-email trusted-contact-email]
  (let [submission (hakija-api/get-hakemus-submission hakemus)
        emails (emails-from-answers (get-in submission [:answers :value]) (some? contact-email))]
    (remove nil? (concat [contact-email trusted-contact-email] emails))))

(defn- emails-for-hakemus-with-signatories [hakemus contact-email trusted-contact-email]
  (let [submission (hakija-api/get-hakemus-submission hakemus)
        emails (emails-from-answers (formutil/flatten-answers (:answers submission) []) (some? contact-email))]
    (remove nil? (concat [contact-email trusted-contact-email] emails))))

(defn- paatos-emails [hakemus-id]
  (let [hakemus (hakija-api/get-hakemus hakemus-id)
        normalized-hakemus (virkailija-db/get-normalized-hakemus hakemus-id)
        contact-email (:contact-email normalized-hakemus)
        trusted-contact-email (:trusted-contact-email normalized-hakemus)]
    (emails-for-hakemus-with-signatories hakemus contact-email trusted-contact-email)))

(defn send-paatokset-lahetetty [avustushaku-id ids identity]
  (let [valmistelija-emails (virkailija-db/get-valmistelija-emails-assigned-to-avustushaku avustushaku-id)
        avustushaku (hakija-api/get-avustushaku avustushaku-id)
        avustushaku-name (get-in avustushaku [:content :name :fi])
        search-id (saved-search/create-or-get-search avustushaku-id ids identity)
        search-url (str (-> config :server :virkailija-url) "/yhteenveto/avustushaku/" avustushaku-id "/listaus/" search-id "/")]
    (log/info "Sending paatokset-lahetetty email for avustushaku-id " avustushaku-id " emails " valmistelija-emails)
    (email/send-paatokset-lahetetty search-url avustushaku-id avustushaku-name valmistelija-emails)))

(defn send-paatos [hakemus-id emails batch-id identity]
  (let [hakemus (hakija-api/get-hakemus hakemus-id)
        avustushaku-id (:avustushaku hakemus)
        avustushaku (hakija-api/get-avustushaku avustushaku-id)
        decision (decision/paatos-html hakemus-id)
        arvio (virkailija-db/get-arvio hakemus-id)
        token (create-application-token (:id hakemus))]
    (log/info "Sending paatos email for hakemus" hakemus-id " to " emails)
    (try
      (if (and (some? token) (not= (:status arvio) "rejected"))
        (email/send-paatos-refuse! emails avustushaku hakemus token)
        (email/send-paatos! emails avustushaku hakemus))

      (if (= (:status arvio) "rejected")
        (email/send-yhteishanke-paatos-refuse! avustushaku hakemus)
        (email/send-yhteishanke-paatos! avustushaku hakemus))

      (tapahtumaloki/create-paatoksen-lahetys-entry
       avustushaku-id hakemus-id identity batch-id emails true)

      (catch Exception e
        (log/error e)
        (tapahtumaloki/create-paatoksen-lahetys-entry
         avustushaku-id hakemus-id identity batch-id emails false)))

    (hakija-api/add-paatos-sent-emails hakemus emails decision)
    (ok {:status "sent" :hakemus hakemus-id :emails emails})))

(defn resend-paatos [hakemus-id emails batch-id identity]
  (let [hakemus (hakija-api/get-hakemus hakemus-id)
        avustushaku-id (:avustushaku hakemus)
        avustushaku (hakija-api/get-avustushaku avustushaku-id)
        decision (decision/paatos-html hakemus-id)
        arvio (virkailija-db/get-arvio hakemus-id)
        token (create-application-token (:id hakemus))]
    (log/info "Resending paatos email for hakemus" hakemus-id " to " emails)

    (try
      (if (and (some? token) (not= (:status arvio) "rejected"))
        (email/send-paatos-refuse! emails avustushaku hakemus token)
        (email/send-paatos! emails avustushaku hakemus))

      (if (= (:status arvio) "rejected")
        (email/send-yhteishanke-paatos-refuse! avustushaku hakemus)
        (email/send-yhteishanke-paatos! avustushaku hakemus))

      (tapahtumaloki/create-paatoksen-lahetys-entry
       avustushaku-id hakemus-id identity batch-id emails true)

      (catch Exception e
        (log/error e)
        (tapahtumaloki/create-paatoksen-lahetys-entry
         avustushaku-id hakemus-id identity batch-id emails false)))

    (hakija-api/update-paatos-sent-emails hakemus emails decision)
    (ok {:status "sent" :hakemus hakemus-id :emails emails})))

(defn re-send-paatos-email [hakemus-id batch-id identity]
  (let [emails (paatos-emails hakemus-id)
        hakemus (hakija-api/get-hakemus hakemus-id)
        avustushaku-id (:avustushaku hakemus)
        avustushaku (hakija-api/get-avustushaku avustushaku-id)
        arvio (virkailija-db/get-arvio hakemus-id)
        token (create-application-token (:id hakemus))]

    (try
      (if (and (some? token) (not= (:status arvio) "rejected"))
        (email/send-paatos-refuse! emails avustushaku hakemus token)
        (email/send-paatos! emails avustushaku hakemus))

      (if (= (:status arvio) "rejected")
        (email/send-yhteishanke-paatos-refuse! avustushaku hakemus)
        (email/send-yhteishanke-paatos! avustushaku hakemus))

      (tapahtumaloki/create-paatoksen-lahetys-entry
       avustushaku-id hakemus-id identity batch-id emails true)

      (catch Exception e
        (log/error e)
        (tapahtumaloki/create-paatoksen-lahetys-entry
         avustushaku-id hakemus-id identity batch-id emails false)))

    (ok {:status "sent" :hakemus hakemus-id :emails emails})))

(defn- regenerate-paatos [hakemus-id]
  (let [decision (decision/paatos-html hakemus-id)]
    (hakija-api/update-paatos-decision hakemus-id decision)
    (ok {:status "regenerated"})))

(defn- send-paatos-for-all [batch-id identity hakemus-id]
  (log/info "send-paatos-for-all" hakemus-id)
  (let [emails (paatos-emails hakemus-id)]
    (send-paatos hakemus-id emails batch-id identity)))

(defn- resend-paatos-for-all [batch-id identity hakemus-id]
  (log/info "resend-paatos-for-all" hakemus-id)
  (let [emails (paatos-emails hakemus-id)]
    (resend-paatos hakemus-id emails batch-id identity)))

(defn get-paatos-email-status
  "Returns only data related to those hakemus ids which are rejected or accepted,
      other statuses are ignored. This is a safeguard: we can't accidentally send email
      to those people which have their hakemus in an invalid state"
  [avustushaku-id]
  (let [status-from-hakija-api (hakija-api/get-paatos-email-status avustushaku-id)
        ids-accepted-or-rejected (virkailija-db/get-finalized-hakemus-ids (map :id status-from-hakija-api))]
    (filter #(contains? (set ids-accepted-or-rejected) (:id %)) status-from-hakija-api)))

(defn get-hakemus-ids-to-send [avustushaku-id]
  (let [hakemukset-email-status (get-paatos-email-status avustushaku-id)]
    (map :id (filter #(nil? (:sent-emails %)) hakemukset-email-status))))

(defn get-hakemus-ids-to-resend [avustushaku-id]
  (let [hakemukset-email-status (get-paatos-email-status avustushaku-id)]
    (map :id (filter #(some? (:sent-emails %)) hakemukset-email-status))))

(defn get-sent-status [avustushaku-id]
  (let [hakemukset-email-status (get-paatos-email-status avustushaku-id)]
    {:ids       (map :id hakemukset-email-status)
     :sent      (count (filter #((complement nil?) (:sent-emails %)) hakemukset-email-status))
     :count     (count hakemukset-email-status)
     :paatokset hakemukset-email-status
     :sent-time (:sent-time (first hakemukset-email-status))}))

(defn- send-selvitys-for-all [avustushaku-id selvitys-type uuid identity hakemus-id]
  (log/info "send-" selvitys-type "-for-all" hakemus-id)
  (let [hakemus (hakija-api/get-hakemus hakemus-id)
        normalized-hakemus (virkailija-db/get-normalized-hakemus hakemus-id)
        contact-email (:contact-email normalized-hakemus)
        trusted-contact-email (:trusted-contact-email normalized-hakemus)
        avustushaku (hakija-api/get-avustushaku avustushaku-id)
        roles (hakija-api/get-avustushaku-roles avustushaku-id)
        arvio (virkailija-db/get-arvio hakemus-id)
        emails (emails-for-hakemus-without-signatories hakemus contact-email trusted-contact-email)]
    (email/send-selvitys-notification! emails avustushaku hakemus selvitys-type arvio roles uuid identity)
    (email/send-yhteishanke-selvitys-processed! avustushaku hakemus selvitys-type)))

(defn send-selvitys-emails [avustushaku-id selvitys-type uuid identity]
  (let [is-loppuselvitys (= selvitys-type "loppuselvitys")
        list-selvitys (if is-loppuselvitys hakija-api/list-loppuselvitys-hakemus-ids hakija-api/list-valiselvitys-hakemus-ids)
        json-ids (list-selvitys avustushaku-id)
        ids (map :id json-ids)
        accepted-ids (virkailija-db/get-accepted-hakemus-ids ids)]
    (log/info "Send" selvitys-type "request to ids" accepted-ids)
    (run! (partial send-selvitys-for-all avustushaku-id selvitys-type uuid identity) accepted-ids)
    (ok {:count (count accepted-ids)
         :hakemukset json-ids})))

(defn- check-hakemukset-have-valmistelija [hakemus-ids]
  (let [hakemukset-missing-valmistelija (virkailija-db/get-hakemukset-without-valmistelija hakemus-ids)]
    (if (not-empty hakemukset-missing-valmistelija)
      (if (= 1 (count hakemukset-missing-valmistelija))
        (bad-request {:error (str "Hakemukselle numero " (first hakemukset-missing-valmistelija) " ei ole valittu valmistelijaa. Päätöksiä ei lähetetty.")})
        (bad-request {:error (str "Hakemuksille numeroilla " (clojure.string/join ", " hakemukset-missing-valmistelija) " ei ole valittu valmistelijaa. Päätöksiä ei lähetetty.")}))
      nil)))

(compojure-api/defroutes
  paatos-routes "Paatos routes"

  (compojure-api/GET "/liitteet" []
    (ok decision-liitteet/Liitteet))

  (compojure-api/POST "/sendall/:avustushaku-id" [:as request]
    :path-params [avustushaku-id :- Long]
    (let [ids (get-hakemus-ids-to-send avustushaku-id)
          uuid (.toString (java.util.UUID/randomUUID))
          identity (authentication/get-request-identity request)]
      (if-let [valmistelija-required-error (check-hakemukset-have-valmistelija ids)]
        valmistelija-required-error
        (do (when (get-in config [:payments :enabled?])
              (log/info "Create initial payment for applications")
              (payments-data/create-grant-payments
               avustushaku-id 0 identity))
            (log/info "Send all paatos ids " ids)
            (run! (partial send-paatos-for-all uuid (authentication/get-request-identity request)) ids)
            (send-paatokset-lahetetty avustushaku-id {:hakemus-ids ids} identity)
            (ok (merge {:status "ok"}
                       (select-keys (get-sent-status avustushaku-id) [:sent :count :sent-time :paatokset])))))))

  (compojure-api/POST "/resendall/:avustushaku-id" [:as request]
    :path-params [avustushaku-id :- Long]
    (let [ids (get-hakemus-ids-to-resend avustushaku-id)
          uuid (.toString (java.util.UUID/randomUUID))]
      (if-let [valmistelija-required-error (check-hakemukset-have-valmistelija ids)]
        valmistelija-required-error
        (do (log/info "Send all paatos ids " ids)
            (run! (partial resend-paatos-for-all uuid (authentication/get-request-identity request)) ids)
            (ok (merge {:status "ok"}
                       (select-keys (get-sent-status avustushaku-id) [:sent :count :sent-time :paatokset])))))))

  (compojure-api/POST "/regenerate/:avustushaku-id" []
    :path-params [avustushaku-id :- Long]
    (let [ids-result (hakija-api/find-regenerate-hakemus-paatos-ids avustushaku-id)
          ids (map :hakemus_id ids-result)]
      (log/info "Regenereate " ids)
      (run! regenerate-paatos ids)
      (ok {:status "ok"})))

  (compojure-api/GET "/sent/:avustushaku-id" []
    :path-params [avustushaku-id :- Long]
    (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
          avustushaku-name (-> avustushaku :content :name :fi)
          sent-status (get-sent-status avustushaku-id)
          first-hakemus-id (first (:ids sent-status))
          first-hakemus (hakija-api/get-hakemus first-hakemus-id)
          first-hakemus-user-key (:user_key first-hakemus)
          first-hakemus-token (get-application-token first-hakemus-id)
          budjettimuutoshakemus-enabled (virkailija-db/has-multiple-menoluokka-rows first-hakemus-id)
          include-muutoshaku-link? (email/should-include-muutoshaku-link-in-paatos-email? avustushaku first-hakemus-id)]
      (ok (merge
           {:status      "ok"
            :mail        (email/mail-example
                          :paatos-refuse
                          {:avustushaku-name avustushaku-name
                           :url              "URL_PLACEHOLDER"
                           :refuse-url       "REFUSE_URL_PLACEHOLDER"
                           :register-number  (:register_number first-hakemus)
                           :project-name     (:project_name first-hakemus)
                           :budjettimuutoshakemus-enabled budjettimuutoshakemus-enabled
                           :include-muutoshaku-link include-muutoshaku-link?
                           :is-jotpa-hakemus (is-jotpa-avustushaku avustushaku)
                           :modify-url       (when include-muutoshaku-link? "MODIFY_URL_PLACEHOLDER")})
            :example-url (email/paatos-url avustushaku-id first-hakemus-user-key :fi)
            :example-modify-url (email-utils/modify-url avustushaku-id first-hakemus-user-key :fi first-hakemus-token true)
            :example-refuse-url
            (email-utils/refuse-url
             avustushaku-id first-hakemus-user-key :fi first-hakemus-token)}
           (select-keys sent-status [:sent :count :sent-time :paatokset])))))

  (compojure-api/GET "/views/:hakemus-id" []
    :path-params [hakemus-id :- Long]
    (ok {:views (hakija-api/find-paatos-views hakemus-id)}))

  (compojure-api/GET "/emails/:hakemus-id" []
    :path-params [hakemus-id :- Long]
    (ok {:emails (paatos-emails hakemus-id)})))
