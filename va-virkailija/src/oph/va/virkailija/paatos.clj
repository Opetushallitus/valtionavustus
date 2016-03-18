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
        emails (vec (remove nil? (distinct [primary-email organization-email signature-email])))
        ]
    emails))

(defn send-paatos [hakemus-id emails]

  (let [hakemus (hakija-api/get-hakemus hakemus-id)
        submission (hakija-api/get-hakemus-submission hakemus)
        answers (:answers submission)
        avustushaku (hakija-api/get-avustushaku (:avustushaku hakemus))
        language (keyword (formutil/find-answer-value answers "language"))
        ]
    (log/info "Sending paatos email for hakemus" hakemus-id " to " emails)
    (email/send-paatos! language emails avustushaku hakemus)
    (ok {:status "sent" :hakemus hakemus-id :emails emails})))

(defn send-paatos-for-all [hakemus-id]
  (log/info "send-paatos-for-all" hakemus-id)
  (let [emails (paatos-emails hakemus-id)]
    (send-paatos hakemus-id emails)))

(defroutes* paatos-routes
            "Paatos routes"
            (POST* "/send/:hakemus-id" []
                   :path-params [hakemus-id :- Long]
                   :body [email (describe virkailija-schema/PaatosEmail "Emails to send")]
                   (log/info "Email: " email)
                   (let [
                         emailWithSpaces (:email email)
                         emailList (str/split emailWithSpaces #" ")
                         ]
                     (send-paatos hakemus-id emailList)
                     ))
            (POST* "/sendall/:avustushaku-id" []
                   :path-params [avustushaku-id :- Long]
                   (let [
                         hakuData (hakija-api/get-submitted-hakemukset avustushaku-id)
                         hakemukset (:hakemukset hakuData)
                         count (count hakemukset)
                         ids (vec (map #(get-in % [:id]) hakemukset))
                         ]
                      (log/info "Send all paatos ids " ids)
                      (run! send-paatos-for-all ids)
                       (ok {:status "ok" :count count})
                     ))

            (GET* "/emails/:hakemus-id" []
                  :path-params [hakemus-id :- Long]
                  (ok {:emails (paatos-emails hakemus-id)})))