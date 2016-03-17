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
    (email/send-paatos! language emails avustushaku hakemus)
    (ok {:status "sent" :hakemus hakemus-id :emails emails})))

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


            (GET* "/emails/:hakemus-id" []
                  :path-params [hakemus-id :- Long]
                  (ok {:emails (paatos-emails hakemus-id)})))