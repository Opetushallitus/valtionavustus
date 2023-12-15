(ns oph.va.hakija.email
  (:require [oph.common.datetime :as datetime]
            [oph.soresu.common.config :refer [config]]
            [oph.common.email :as email]
            [oph.common.email-utils :as email-utils]
            [clojure.tools.logging :as log]
            [clostache.parser :refer [render]]))

(def mail-titles
  {:new-hakemus {:fi "Linkki organisaationne avustushakemukseen"
                 :sv "Länk till er organisations ansökan om understöd"}
   :new-jotpa-hakemus {:fi "Linkki organisaationne avustushakemukseen"
                       :sv "Länk till er organisations ansökan om understöd"}
   :hakemus-submitted {:fi "Automaattinen viesti: organisaationne avustushakemus on kirjattu vastaanotetuksi"
                       :sv "Automatisk meddelande: er organisations ansökan om understöd har mottagits"}
   :hakemus-submitted-after-change-request {:fi "Automaattinen viesti: organisaationne avustushakemusta on täydennetty"
                                            :sv "Automatiskt meddelande: er ansökan om understöd har kompletterats"}
   :hakemus-change-request-responded {:fi "Automaattinen viesti: avustushakemusta on täydennetty"}
   :loppuselvitys-change-request-responded {:fi "Automaattinen viesti: avustushakemuksen loppuselvitystä on täydennetty"}
   :loppuselvitys-change-request-response-received {:fi "Organisaationne loppuselvitystä on täydennetty:"
                                           :sv "Slutredovisningen för er organisation är kompletterad:"}
   :valiselvitys-submitted-notification {:fi "Väliselvityksenne on vastaanotettu"
                                         :sv "Er mellanredovisning har emottagits"}
   :loppuselvitys-submitted-notification {:fi "Loppuselvityksenne on vastaanotettu"
                                          :sv "Er slutredovisning har emottagits"}
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
   :new-jotpa-hakemus {:fi (email/load-template "email-templates/new-jotpa-hakemus.plain.fi")
                       :sv (email/load-template "email-templates/new-jotpa-hakemus.plain.sv")}
   :hakemus-submitted {:fi (email/load-template "email-templates/hakemus-submitted.plain.fi")
                       :sv (email/load-template "email-templates/hakemus-submitted.plain.sv")}
   :hakemus-change-request-responded {:fi (email/load-template "email-templates/hakemus-change-request-responded.plain.fi")}
   :loppuselvitys-change-request-responded {:fi (email/load-template "email-templates/loppuselvitys-change-request-responded.plain.fi")}
   :loppuselvitys-change-request-response-received {:fi (email/load-template "email-templates/loppuselvitys-change-request-received.plain.fi")
                                           :sv (email/load-template "email-templates/loppuselvitys-change-request-received.plain.sv")}
   :valiselvitys-submitted-notification {:fi (email/load-template "email-templates/valiselvitys-submitted-notification.plain.fi")
                                         :sv (email/load-template "email-templates/valiselvitys-submitted-notification.plain.sv")}
   :loppuselvitys-submitted-notification {:fi (email/load-template "email-templates/loppuselvitys-submitted-notification.plain.fi")
                                          :sv (email/load-template "email-templates/loppuselvitys-submitted-notification.plain.sv")}
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

(defn- render-body [msg]
  (let [{:keys [email-type lang]} msg
        template (get-in mail-templates [email-type lang])]
    (render template msg)))

(defn generate-virkailija-url [avustushaku-id hakemus-db-id]
  (str (-> config :server :virkailija-url)
       "/avustushaku/"
       avustushaku-id
       "/hakemus/"
       hakemus-db-id
       "/"))

(defn selvitys-preview-url [avustushaku-id selvitys-user-key lang selvitys-type]
  (let [va-url (-> config :server :url lang)
        lang-str (or (clojure.core/name lang) "fi")]
    (str va-url "avustushaku/" avustushaku-id "/" selvitys-type "?" selvitys-type "=" selvitys-user-key "&lang=" lang-str "&preview=true")))

(defn send-selvitys-submitted-message! [avustushaku-id selvitys-user-key selvitys-type lang hakemus-id hakemus-name register-number to]
  (log/info "Sending notification for a submitted selvitys of type " selvitys-type)
  (let [type (if (= selvitys-type "loppuselvitys")
                :loppuselvitys-submitted-notification
                :valiselvitys-submitted-notification)
        subject (get-in mail-titles [type lang])
        template (get-in mail-templates [type lang])
        preview-url (selvitys-preview-url avustushaku-id selvitys-user-key lang selvitys-type)]
    (email/try-send-msg-once {:email-type type
                              :lang lang
                              :from (-> email/smtp-config :from lang)
                              :sender (-> email/smtp-config :sender)
                              :to to
                              :subject subject
                              :hakemus-id hakemus-id
                              :hakemus-name hakemus-name
                              :register-number register-number
                              :preview-url preview-url}
                             (partial render template))))

(defn send-new-jotpa-hakemus-message! [lang to avustushaku-id avustushaku user-key start-date end-date]
  (let [start-date-string (datetime/date-string start-date)
        start-time-string (datetime/time-string start-date)
        end-date-string (datetime/date-string end-date)
        end-time-string (datetime/time-string end-date)
        url (email-utils/generate-url avustushaku-id lang user-key false)
        msg {:operation :send
             :email-type :new-hakemus
             :lang lang
             :from "no-reply@jotpa.fi"
             :sender (-> email/smtp-config :sender)
             :subject (get-in mail-titles [:new-jotpa-hakemus lang])
             :to to
             :avustushaku avustushaku
             :avustushaku-id avustushaku-id
             :start-date start-date-string
             :start-time start-time-string
             :end-date end-date-string
             :end-time end-time-string
             :url url}
        body (render-body (assoc msg :email-type :new-jotpa-hakemus))]
    (log/info "Url would be: " url)
    (email/enqueue-message-to-be-send msg body)))

(defn send-new-hakemus-message! [lang to avustushaku-id avustushaku user-key start-date end-date]
  (let [start-date-string (datetime/date-string start-date)
        start-time-string (datetime/time-string start-date)
        end-date-string (datetime/date-string end-date)
        end-time-string (datetime/time-string end-date)
        url (email-utils/generate-url avustushaku-id lang user-key false)
        msg {:operation :send
             :email-type :new-hakemus
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
             :url url}
        body (render-body msg)]
    (log/info "Url would be: " url)
    (email/enqueue-message-to-be-send msg body)))

(defn generate-refused-email [lang recipients grant-name hakemus-id]
  {:operation :send
   :email-type :application-refused
   :hakemus-id hakemus-id
   :lang lang
   :from (get-in email/smtp-config [:from lang])
   :sender (:sender email/smtp-config)
   :subject (get-in mail-titles [:application-refused lang])
   :to recipients
   :grant-name grant-name})

(defn send-refused-message! [lang recipients grant-name hakemus-id]
  (let [msg (generate-refused-email lang recipients grant-name hakemus-id)
        body (render-body msg)]
  (email/enqueue-message-to-be-send msg body)))

(defn generate-presenter-refused-email [recipients grant application-id]
  (let [url (generate-virkailija-url (:id grant) application-id)
        lang :fi]
    {:operation :send
     :email-type :application-refused-presenter
     :lang lang
     :from (get-in email/smtp-config [:from lang])
     :sender (:sender email/smtp-config)
     :subject (get-in mail-titles [:application-refused-presenter lang])
     :to recipients
     :grant-name (get-in grant [:content :name lang])
     :url url}))

(defn send-refused-message-to-presenter! [recipients grant application-id]
  (let [msg (generate-presenter-refused-email recipients grant application-id)
        body (render-body msg)]
    (email/enqueue-message-to-be-send msg body)))

(defn generate-applicant-edit-email [lang recipients grant-name hakemus]
  {:operation :send
   :email-type :hakemus-edited-after-applicant-edit
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
  (let [msg (generate-applicant-edit-email lang recipients grant-name hakemus)
        body (render-body msg)]
  (email/enqueue-message-to-be-send msg body)))

(defn notify-valmistelija-of-new-muutoshakemus [to avustushaku-id register-number hanke hakemus-id]
  (let [lang :fi
        url (generate-virkailija-url avustushaku-id hakemus-id)
        msg {:operation :send
             :email-type :notify-valmistelija-of-new-muutoshakemus
             :lang lang
             :from (-> email/smtp-config :from lang)
             :sender (-> email/smtp-config :sender)
             :hakemus-id hakemus-id
             :subject (get-in mail-titles [:notify-valmistelija-of-new-muutoshakemus lang])
             :to to
             :hanke hanke
             :register-number register-number
             :url url}
        body (render-body msg)]
    (log/info "Notifying valmistelija of new muutoshakemus: " url)
    (email/enqueue-message-to-be-send msg body)))

(defn send-change-request-responded-message-to-virkailija! [to avustushaku-id avustushaku-name-fi hakemus-db-id]
  (let [lang :fi
        url (generate-virkailija-url avustushaku-id hakemus-db-id)
        msg {:operation :send
             :email-type :hakemus-change-request-responded
             :lang lang
             :from (-> email/smtp-config :from lang)
             :sender (-> email/smtp-config :sender)
             :subject (get-in mail-titles [:hakemus-change-request-responded lang])
             :to to
             :avustushaku avustushaku-name-fi
             :url url}
        body (render-body msg)]
    (log/info "Url would be: " url)
    (email/enqueue-message-to-be-send msg body)))

(defn send-loppuselvitys-change-request-responded-message-to-virkailija! [to avustushaku-id avustushaku-name-fi parent-hakemus-id]
  (let [lang :fi
        url (str (generate-virkailija-url avustushaku-id parent-hakemus-id) "loppuselvitys/")
        msg {:operation :send
             :email-type :loppuselvitys-change-request-responded
             :lang lang
             :hakemus-id parent-hakemus-id
             :from (-> email/smtp-config :from lang)
             :sender (-> email/smtp-config :sender)
             :subject (get-in mail-titles [:loppuselvitys-change-request-responded lang])
             :to to
             :avustushaku avustushaku-name-fi
             :url url}
        body (render-body msg)]
    (log/info "Url would be: " url)
    (email/enqueue-message-to-be-send msg body)))

(defn send-loppuselvitys-change-request-received-message-to-hakija! [to avustushaku-id parent-hakemus-id lang register-number project-name email-of-virkailija virkailija-first-name virkailija-last-name]
  (let [subject (format "%s %s %s" (get-in mail-titles [:loppuselvitys-change-request-response-received lang]) register-number project-name)
          msg {
             :operation :send
             :email-type :loppuselvitys-change-request-response-received
             :lang lang
             :hakemus-id parent-hakemus-id
             :from (-> email/smtp-config :from lang)
             :sender (-> email/smtp-config :sender)
             :subject subject
             :to to
             :project-name project-name
             :register-number register-number
             :email-of-virkailija email-of-virkailija
             :virkailija-first-name virkailija-first-name
             :virkailija-last-name virkailija-last-name
             }
        body (render-body msg)]
    (email/enqueue-message-to-be-send msg body)))

(defn send-hakemus-submitted-message! [is-change-request-response? lang to avustushaku-id avustushaku user-key start-date end-date hakemus-id]
  (let [start-date-string (datetime/date-string start-date)
        start-time-string (datetime/time-string start-date)
        end-date-string (datetime/date-string end-date)
        end-time-string (datetime/time-string end-date)
        url (email-utils/generate-url avustushaku-id lang user-key true)
        user-message {:operation :send
                      :email-type  :hakemus-submitted
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
                      :url url
                      :avustushaku-id avustushaku-id
                      :hakemus-id hakemus-id}
        body (render-body user-message)]
    (log/info "Urls would be: " url)
    (email/enqueue-message-to-be-send user-message body)))
