(ns oph.va.hakija.email
  (:require [oph.common.datetime :as datetime]
            [oph.common.email :as email]
            [clojure.tools.logging :as log]
            [clostache.parser :refer [render]]))

(def mail-titles
  {:new-hakemus {:fi "Linkki organisaationne avustushakemukseen"
                 :sv "Länk till er organisations ansökan om understöd"}
   :hakemus-submitted {:fi "Automaattinen viesti: organisaationne avustushakemus on kirjattu vastaanotetuksi"
                       :sv "Automatisk meddelande: er organisations ansökan om understöd har mottagits"}
   :hakemus-submitted-after-change-request {:fi "Automaattinen viesti: organisaationne avustushakemusta on täydennetty"
                                            :sv "Automatiskt meddelande: er ansökan om understöd har kompletterats"}
   :hakemus-change-request-responded {:fi "Automaattinen viesti: avustushakemusta on täydennetty"}
   :notify-valmistelija-of-new-muutoshakemus {:fi "Automaattinen viesti: saapunut muutoshakemus"}
   :application-refused-presenter
   {:fi "Automaattinen viesti: Avustuksen saajan ilmoitus"}
   :application-refused {:fi "Ilmoitus avustuksenne vastaanottamatta jättämisestä on lähetetty"
                         :sv "Er anmälan om att ni inte tar emot understödet har lämnats in till"}
   :hakemus-edited-after-applicant-edit {:fi "Automaattinen viesti: hankkeen yhteystietoja on muokattu"
                                         :sv "Automatisk meddelande: projektets kontaktuppgifterna har ändrats"}})

(def mail-templates
  {:new-hakemus {:fi (email/load-template "email-templates/new-hakemus.plain.fi")
                 :sv (email/load-template "email-templates/new-hakemus.plain.sv")}
   :hakemus-submitted {:fi (email/load-template "email-templates/hakemus-submitted.plain.fi")
                       :sv (email/load-template "email-templates/hakemus-submitted.plain.sv")}
   :hakemus-change-request-responded {:fi (email/load-template "email-templates/hakemus-change-request-responded.plain.fi")}
   :notify-valmistelija-of-new-muutoshakemus {:fi (email/load-template "email-templates/notify-valmistelija-of-new-muutoshakemus.plain.fi")}
   :application-refused-presenter
   {:fi (email/load-template
         "email-templates/application-refused-presenter.plain.fi")}
   :application-refused {:fi (email/load-template
                              "email-templates/application-refused.plain.fi")
                         :sv (email/load-template
                              "email-templates/application-refused.plain.sv")}
   :hakemus-edited-after-applicant-edit {:fi (email/load-template
                                              "email-templates/hakemus-edited-after-applicant-edit.plain.fi")
                                         :sv (email/load-template
                                              "email-templates/hakemus-edited-after-applicant-edit.plain.sv")}})

(defn start-background-job-send-mails []
  (email/start-background-job-send-mails mail-templates))

(defn stop-background-job-send-mails []
  (email/stop-background-job-send-mails))

(defn send-new-hakemus-message! [lang to avustushaku-id avustushaku user-key start-date end-date]
  (let [lang-str (or (clojure.core/name lang) "fi")
        start-date-string (datetime/date-string start-date)
        start-time-string (datetime/time-string start-date)
        end-date-string (datetime/date-string end-date)
        end-time-string (datetime/time-string end-date)
        url (email/generate-url avustushaku-id lang lang-str user-key false)]
    (log/info "Url would be: " url)
    (email/enqueue-message-to-be-send {:operation :send
                                       :type :new-hakemus
                                       :lang lang
                                       :from (-> email/smtp-config :from lang)
                                       :sender (-> email/smtp-config :sender)
                                       :subject (get-in mail-titles [:new-hakemus lang])
                                       :to to
                                       :avustushaku avustushaku
                                       :avustushaku-id avustushaku-id
                                       :start-date start-date-string
                                       :start-time start-time-string
                                       :end-date end-date-string
                                       :end-time end-time-string
                                       :url url})))

(defn generate-refused-email [lang recipients grant-name]
  {:operation :send
   :type :application-refused
   :lang lang
   :from (get-in email/smtp-config [:from lang])
   :sender (:sender email/smtp-config)
   :subject (get-in mail-titles [:application-refused lang])
   :to recipients
   :grant-name grant-name})

(defn send-refused-message! [lang recipients grant-name]
  (email/enqueue-message-to-be-send
       (generate-refused-email lang recipients grant-name)))

(defn generate-presenter-refused-email [recipients grant application-id]
  (let [url (email/generate-virkailija-url (:id grant) application-id)
        lang :fi]
    {:operation :send
     :type :application-refused-presenter
     :lang lang
     :from (get-in email/smtp-config [:from lang])
     :sender (:sender email/smtp-config)
     :subject (get-in mail-titles [:application-refused-presenter lang])
     :to recipients
     :grant-name (get-in grant [:content :name lang])
     :url url}))

(defn send-refused-message-to-presenter! [recipients grant application-id]
  (email/enqueue-message-to-be-send
       (generate-presenter-refused-email recipients grant application-id)))

(defn generate-applicant-edit-email [lang recipients grant-name hakemus]
  {:operation :send
   :type :hakemus-edited-after-applicant-edit
   :lang lang
   :from (get-in email/smtp-config [:from lang])
   :sender (:sender email/smtp-config)
   :subject (get-in mail-titles [:hakemus-edited-after-applicant-edit lang])
   :to recipients
   :grant-name grant-name
   :register-number (:register_number hakemus)
   :project-name (:project_name hakemus)
   :organization-name (:organization_name hakemus)
   :hakemus-id (:id hakemus)
   :avustushaku-id (:avustushaku hakemus)})

(defn send-applicant-edit-message! [lang recipients grant-name hakemus]
  (email/enqueue-message-to-be-send
       (generate-applicant-edit-email lang recipients grant-name hakemus)))

(defn notify-valmistelija-of-new-muutoshakemus [to avustushaku-id register-number hanke hakemus-id]
  (let [lang :fi
        url (email/generate-virkailija-url avustushaku-id hakemus-id)
        msg {:operation :send
                          :type :notify-valmistelija-of-new-muutoshakemus
                          :lang lang
                          :from (-> email/smtp-config :from lang)
                          :sender (-> email/smtp-config :sender)
                          :hakemus-id hakemus-id
                          :subject (get-in mail-titles [:notify-valmistelija-of-new-muutoshakemus lang])
                          :to to
                          :hanke hanke
                          :register-number register-number
                          :url url}
        formatted-message (render (get-in mail-templates [:notify-valmistelija-of-new-muutoshakemus lang]) msg)]
    (log/info "Notifying valmistelija of new muutoshakemus: " url)
    (email/enqueue-message-to-be-send msg)))

(defn send-change-request-responded-message-to-virkailija! [to avustushaku-id avustushaku-name-fi hakemus-db-id]
  (let [lang :fi
        url (email/generate-virkailija-url avustushaku-id hakemus-db-id)]
    (log/info "Url would be: " url)
    (email/enqueue-message-to-be-send {:operation :send
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
                      :type  :hakemus-submitted
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
                      :url url}]
    (log/info "Urls would be: " url)
    (email/enqueue-message-to-be-send user-message)))
