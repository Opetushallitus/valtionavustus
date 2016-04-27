(ns oph.va.virkailija.paatos
  (:require
   [ring.util.http-response :refer :all]
   [compojure.core :refer [defroutes GET POST]]
   [compojure.api.sweet :refer :all]
   [oph.va.hakija.api :as hakija-api]
   [oph.soresu.form.formutil :as formutil]
   [oph.va.virkailija.email :as email]
   [oph.va.virkailija.schema :as virkailija-schema]
   [oph.va.virkailija.hakudata :as hakudata]
   [oph.va.virkailija.db :as virkailija-db]
   [clojure.tools.logging :as log]
   [clojure.string :as str]))

(defn is-notification-email-field? [field]
  (or
    (formutil/has-field-type? "vaEmailNotification" field)
    ;;This array is for old-style email-fields which did not yet have the :vaEmailNotification field-type
    (some #(= (:key field) %) ["organization-email" "primary-email" "signature-email"])))

(defn- emails-from-answers [answers]
  (map :value (formutil/filter-values #(is-notification-email-field? %) (answers :value))))

(defn- paatos-emails [hakemus-id]
  (let [hakemus (hakija-api/get-hakemus hakemus-id)
        submission (hakija-api/get-hakemus-submission hakemus)
        answers (:answers submission)
        emails (vec (remove nil? (distinct (emails-from-answers answers))))]
    emails))

(defn send-paatos [hakemus-id emails]
  (let [hakemus (hakija-api/get-hakemus hakemus-id)
        submission (hakija-api/get-hakemus-submission hakemus)
        avustushaku-id (:avustushaku hakemus)
        answers (:answers submission)
        avustushaku (hakija-api/get-avustushaku avustushaku-id)
        presenting-officer-email (hakudata/presenting-officer-email avustushaku-id)
        language (keyword (formutil/find-answer-value answers "language"))]
    (log/info "Sending paatos email for hakemus" hakemus-id " to " emails)
    (email/send-paatos! language emails avustushaku hakemus presenting-officer-email)
    (hakija-api/add-paatos-sent-emails hakemus emails)
    (ok {:status "sent" :hakemus hakemus-id :emails emails})))

(defn send-paatos-for-all [hakemus-id]
  (log/info "send-paatos-for-all" hakemus-id)
  (let [emails (paatos-emails hakemus-id)]
    (send-paatos hakemus-id emails)))

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

(defn get-sent-status [avustushaku-id]
  (let [hakemukset-email-status (get-paatos-email-status avustushaku-id)]
    {:ids (map :id hakemukset-email-status)
     :sent (count (filter #((complement nil?) (:sent-emails %)) hakemukset-email-status))
     :count (count hakemukset-email-status)
     :sent-time (:sent-time (first hakemukset-email-status))}))

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
         (let [ids (get-hakemus-ids-to-send avustushaku-id)]
           (log/info "Send all paatos ids " ids)
           (run! send-paatos-for-all ids)
           (ok (merge {:status "ok"}
                      (select-keys (get-sent-status avustushaku-id) [:sent :count :sent-time])))))

  (GET* "/sent/:avustushaku-id" []
        :path-params [avustushaku-id :- Long]
        (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
              avustushaku-name (-> avustushaku :content :name :fi)
              sent-status (get-sent-status avustushaku-id)
              first-hakemus-id (first (:ids sent-status))
              first-hakemus (hakija-api/get-hakemus first-hakemus-id)
              first-hakemus-user-key (:user_key first-hakemus)]
          (ok (merge
                {:status "ok"
                 :mail (email/mail-example
                         :paatos {:avustushaku-name avustushaku-name
                                  :url "URL_PLACEHOLDER"
                                  :register-number (:register_number first-hakemus)
                                  :project-name (:project_name first-hakemus)})
                 :example-url (email/paatos-url avustushaku-id first-hakemus-user-key :fi)}
                (select-keys sent-status [:sent :count :sent-time])))))

  (GET* "/emails/:hakemus-id" []
        :path-params [hakemus-id :- Long]
        (ok {:emails (paatos-emails hakemus-id)})))
