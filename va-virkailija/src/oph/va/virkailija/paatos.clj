(ns oph.va.virkailija.paatos
  (:require
   [ring.util.http-response :refer :all]
   [compojure.core :refer [defroutes GET POST]]
   [compojure.api.sweet :refer :all]
   [oph.va.hakija.api :as hakija-api]
   [oph.soresu.form.formutil :as formutil]
   [oph.va.virkailija.email :as email]
   [oph.va.virkailija.schema :as virkailija-schema]
   [clojure.tools.logging :as log]
   [clojure.string :as str]))

(defn- paatos-emails [hakemus-id]
  (let [hakemus (hakija-api/get-hakemus hakemus-id)
        submission (hakija-api/get-hakemus-submission hakemus)
        answers (:answers submission)
        primary-email (formutil/find-answer-value answers "primary-email")
        organization-email (formutil/find-answer-value answers "organization-email")
        signature-email (formutil/find-answer-value answers "signature-email")
        emails (vec (remove nil? (distinct [primary-email organization-email signature-email])))]
    emails))

(defn send-paatos [hakemus-id emails]
  (let [hakemus (hakija-api/get-hakemus hakemus-id)
        submission (hakija-api/get-hakemus-submission hakemus)
        answers (:answers submission)
        avustushaku (hakija-api/get-avustushaku (:avustushaku hakemus))
        language (keyword (formutil/find-answer-value answers "language"))]
    (log/info "Sending paatos email for hakemus" hakemus-id " to " emails)
    (email/send-paatos! language emails avustushaku hakemus)
    (hakija-api/add-paatos-sent-emails hakemus emails)
    (ok {:status "sent" :hakemus hakemus-id :emails emails})))

(defn send-paatos-for-all [hakemus-id]
  (log/info "send-paatos-for-all" hakemus-id)
  (let [emails (paatos-emails hakemus-id)]
    (send-paatos hakemus-id emails)))

(defn get-sent-count [avustushaku-id]
  (let [sent-email-status (hakija-api/get-paatos-sent-emails avustushaku-id)
        sent (count (filter #((complement nil?) (:sent-emails %)) sent-email-status))]
    {:sent sent :count (count sent-email-status)}))

(defroutes* paatos-routes
  "Paatos routes"
  (POST* "/send/:hakemus-id" []
         :path-params [hakemus-id :- Long]
         :body [email (describe virkailija-schema/PaatosEmail "Emails to send")]
         (log/info "Email: " email)
         (let [email-with-spaces (:email email)
               email-list (str/split email-with-spaces #" ")]
           (send-paatos hakemus-id email-list)))
  (POST* "/sendall/:avustushaku-id" []
         :path-params [avustushaku-id :- Long]
         (let [hakemukset (hakija-api/get-paatos-sent-emails avustushaku-id)
               ids (map :id (filter #(nil? (:sent-emails %)) hakemukset))]
           (log/info "Send all paatos ids " ids)
           (run! send-paatos-for-all ids)
           (ok (merge {:status "ok"} (get-sent-count avustushaku-id)))))

  (GET* "/sent/:avustushaku-id" []
        :path-params [avustushaku-id :- Long]
        (println (email/mail-example :paatos))
        (ok (merge {:status "ok" :mail (email/mail-example :paatos)}
                   (get-sent-count avustushaku-id))))

  (GET* "/emails/:hakemus-id" []
        :path-params [hakemus-id :- Long]
        (ok {:emails (paatos-emails hakemus-id)})))
