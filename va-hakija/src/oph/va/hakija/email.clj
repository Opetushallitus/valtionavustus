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
                       :sv "Automatisk meddelande: er organisations ansökan om understöd har mottagits"}
   :hakemus-submitted-after-change-request {:fi "Automaattinen viesti: organisaationne avustushakemusta on täydennetty"
                                            :sv "Automatiskt meddelande: er ansökan om understöd har kompletterats"}
   :hakemus-change-request-responded {:fi "Automaattinen viesti: avustushakemusta on täydennetty"}})

(def mail-templates
  {:new-hakemus {:fi (email/load-template "email-templates/new-hakemus.plain.fi")
                 :sv (email/load-template "email-templates/new-hakemus.plain.sv")}
   :hakemus-submitted {:fi (email/load-template "email-templates/hakemus-submitted.plain.fi")
                       :sv (email/load-template "email-templates/hakemus-submitted.plain.sv")}
   :hakemus-change-request-responded {:fi (email/load-template "email-templates/hakemus-change-request-responded.plain.fi")}})

(defn start-background-job-send-mails []
  (email/start-background-job-send-mails mail-templates))

(defn stop-background-job-send-mails []
  (email/stop-background-job-send-mails))

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
    (>!! email/mail-chan {:operation :send
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

(defn send-change-request-responded-message-to-virkailija! [to avustushaku-id avustushaku-name-fi hakemus-db-id]
  (let [lang :fi
        url (email/generate-virkailija-url avustushaku-id hakemus-db-id)]
    (log/info "Url would be: " url)
    (>!! email/mail-chan {:operation :send
                          :type :hakemus-change-request-responded
                          :lang lang
                          :from (-> email/smtp-config :from lang)
                          :sender (-> email/smtp-config :sender)
                          :subject (get-in mail-titles [:hakemus-change-request-responded lang])
                          :to to
                          :avustushaku avustushaku-name-fi
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
                      :subject (get-in mail-titles [(if is-change-request-response? :hakemus-submitted-after-change-request :hakemus-submitted) lang])
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
    (>!! email/mail-chan user-message)
    (>!! email/mail-chan registry-message)))
