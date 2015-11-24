(ns oph.va.hakija.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [oph.common.datetime :as datetime]
            [oph.common.email :as email]
            [clojure.tools.trace :refer [trace]]
            [clojure.tools.logging :as log]
            [clostache.parser :refer [render]]
            [oph.soresu.common.config :refer [config]]))

(def mail-titles
  {:new-hakemus {:fi "Linkki organisaationne avustushakemukseen"
                 :sv "Länk till er organisations ansökan om understöd"}
   :hakemus-submitted {:fi "Automaattinen viesti: organisaationne avustushakemus on kirjattu vastaanotetuksi"
                       :sv "Automatisk meddelande: organisationens bidragsansökan mottogs"}
   :change-request-responded {:fi "Automaattinen viesti: organisaationne avustushakemusta on täydennetty"
                              :sv "Automatisk meddelande: organisationens bidragsansökan har kompletterat"}})

(def mail-templates
  {:new-hakemus {:fi (email/load-template "email-templates/new-hakemus.plain.fi")
                 :sv (email/load-template "email-templates/new-hakemus.plain.sv")}
   :hakemus-submitted {:fi (email/load-template "email-templates/hakemus-submitted.plain.fi")
                       :sv (email/load-template "email-templates/hakemus-submitted.plain.fi")}})

(defn start-background-sender []
  (email/start-background-sender mail-templates))

(defn stop-background-sender []
  (email/stop-background-sender))

(defn oph-register-email-title [is-change-request-response? avustushaku-name start-date-string end-date-string]
  (if is-change-request-response?
    (str "[Valtionavustus] Täydennetty hakemus hakuun '" avustushaku-name "' (" start-date-string "-" end-date-string ")")
    (str "[Valtionavustus] Uusi hakemus hakuun '" avustushaku-name "' (" start-date-string "-" end-date-string ")")))

(defn send-new-hakemus-message! [lang to avustushaku-id avustushaku user-key start-date end-date]
  (let [lang-str (or (clojure.core/name lang) "fi")
        start-date-string (datetime/date-string start-date)
        start-time-string (datetime/time-string start-date)
        end-date-string (datetime/date-string end-date)
        end-time-string (datetime/time-string end-date)
        url (email/generate-url avustushaku-id lang lang-str user-key false)]
    (log/info "Url would be: " url)
    (>!! email/mail-queue {:operation :send
                           :type :new-hakemus
                           :lang lang
                           :from (-> email/smtp-config :from lang)
                           :sender (-> email/smtp-config :sender)
                           :subject (get-in mail-titles [:new-hakemus lang])
                           :to to
                           :avustushaku avustushaku
                           :start-date start-date-string
                           :start-time start-time-string
                           :end-date end-date-string
                           :end-time end-time-string
                           :url url})))

(defn send-hakemus-submitted-message! [is-change-request-response? lang to avustushaku-id avustushaku user-key start-date end-date]
  (let [lang-str (or (clojure.core/name lang) "fi")
        start-date-string (datetime/date-string start-date)
        start-time-string (datetime/time-string start-date)
        end-date-string (datetime/date-string end-date)
        end-time-string (datetime/time-string end-date)
        url (email/generate-url avustushaku-id lang lang-str user-key true)
        user-message {:operation :send
                      :type :hakemus-submitted
                      :lang lang
                      :from (-> email/smtp-config :from lang)
                      :sender (-> email/smtp-config :sender)
                      :subject (get-in mail-titles [(if is-change-request-response? :change-request-responded :hakemus-submitted) lang])
                      :to to
                      :avustushaku avustushaku
                      :start-date start-date-string
                      :start-time start-time-string
                      :end-date end-date-string
                      :end-time end-time-string
                      :url url}
        registry-message (-> user-message
                             (assoc :to (vector (-> email/smtp-config :registry-address)))
                             (assoc :subject (oph-register-email-title is-change-request-response? avustushaku start-date-string end-date-string)))]
    (log/info "Url would be: " url)
    (>!! email/mail-queue user-message)
    (>!! email/mail-queue registry-message)))
