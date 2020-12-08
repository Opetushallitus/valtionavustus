(ns oph.va.virkailija.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [oph.soresu.common.db :refer [exec get-datasource]]
            [clojure.java.jdbc :as jdbc]
            [oph.common.email :as email]
            [oph.soresu.form.formutil :as form-util]
            [oph.soresu.common.config :refer [config]]
            [clojure.tools.trace :refer [trace]]
            [clojure.tools.logging :as log]
            [clostache.parser :refer [render]])
  (:use [clojure.java.io]))

(def mail-titles
  {:change-request {:fi "Täydennyspyyntö avustushakemukseesi"
                    :sv "Begäran om komplettering av ansökan"}
   :paatos {:fi "Automaattinen viesti: organisaationne avustushakemus on käsitelty - Linkki päätösasiakirjaan"
            :sv "Automatiskt meddelande: Er ansökan om understöd har behandlats – Länk till beslutet"}
   :muutoshakemus-paatos {:fi "Automaattinen viesti: organisaationne muutoshakemus on käsitelty - Linkki päätösasiakirjaan"
            :sv "Automaattinen viesti: organisaationne muutoshakemus on käsitelty - Linkki päätösasiakirjaan"}
   :selvitys {:fi "Väliselvitys käsitelty"
              :sv "Mellanredovisning behandlat"}
   :valiselvitys-notification {:fi "Väliselvitys täytettävissä haulle"
                               :sv "Mellanredovisningnen redo att fyllas"}
   :loppuselvitys-notification {:fi "Loppuselvitys täytettävissä haulle"
                                :sv "Slutredovisningen redo att fyllas"}
   :payments-info-notification
   {:fi "Automaattinen viesti - Valtionavustuserän '%s' maksatus suoritettu"
    :sv "Automatiskt meddelande - Statsunderstöd '%s' betald"}})

(def mail-templates
  {:change-request {:fi (email/load-template "email-templates/change-request.plain.fi")
                    :sv (email/load-template "email-templates/change-request.plain.sv")}
   :paatos {:fi (email/load-template "email-templates/paatos.plain.fi")
            :sv (email/load-template "email-templates/paatos.plain.sv")}
   :muutoshakemus-paatos {:fi (email/load-template "email-templates/muutoshakemus-paatos.plain.fi")
            :sv (email/load-template "email-templates/muutoshakemus-paatos.plain.sv")}
   :paatos-refuse
   {:fi (email/load-template "email-templates/paatos-refuse.plain.fi")
    :sv (email/load-template "email-templates/paatos-refuse.plain.sv")}
   :selvitys {:fi (email/load-template "email-templates/selvitys.plain.fi")
              :sv (email/load-template "email-templates/selvitys.plain.sv")}
   :valiselvitys-notification {:fi (email/load-template "email-templates/valiselvitys-notification.plain.fi")
                               :sv (email/load-template "email-templates/valiselvitys-notification.plain.sv")}
   :loppuselvitys-notification {:fi (email/load-template "email-templates/loppuselvitys-notification.plain.fi")
                                :sv (email/load-template "email-templates/loppuselvitys-notification.plain.sv")}
   :payments-info-notification
   {:fi (email/load-template "email-templates/payments-info.fi")
    :sv (email/load-template "email-templates/payments-info.fi")}})

(defn mail-example [msg-type & [data]]
  {:content (render (:fi (msg-type mail-templates)) (if data data {}))
   :subject (:fi (msg-type mail-titles))
   :sender (-> email/smtp-config :sender)})

(defn start-background-job-send-mails []
  (email/start-background-job-send-mails mail-templates))

(defn stop-background-job-send-mails []
  (email/stop-background-job-send-mails))

(defn send-change-request-message! [lang to avustushaku-id avustushaku-name user-key change-request presenting-officer-email]
  (let [lang-str (or (clojure.core/name lang) "fi")
        url (email/generate-url avustushaku-id lang lang-str user-key false)]
    (log/info "Url would be: " url)
    (>!! email/mail-chan {:operation :send
                          :type :change-request
                          :lang lang
                          :from (-> email/smtp-config :from lang)
                          :reply-to presenting-officer-email
                          :bcc presenting-officer-email
                          :sender (-> email/smtp-config :sender)
                          :subject (get-in mail-titles [:change-request lang])
                          :to [to]
                          :avustushaku avustushaku-name
                          :url url
                          :change-request change-request})))

(defn paatos-url [avustushaku-id user-key lang]
  (let [va-url (-> config :server :url lang)]
  (str va-url "paatos/avustushaku/" avustushaku-id "/hakemus/" user-key)))

(defn selvitys-url [avustushaku-id user-key lang selvitys-type]
  (let [va-url (-> config :server :url lang)
        lang-str (or (clojure.core/name lang) "fi")]
  (str va-url "avustushaku/" avustushaku-id "/" selvitys-type "?hakemus=" user-key "&lang=" lang-str)))

(defn store-normalized-hakemus [id answers]
  (log/info (str "Storing normalized fields for hakemus: " id))
  (jdbc/with-db-transaction [connection {:datasource (get-datasource)}]
        (jdbc/execute!
               connection
                    ["INSERT INTO virkailija.normalized_hakemus (hakemus_id, project_name, contact_person, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?) ON CONFLICT (hakemus_id) DO UPDATE SET project_name = EXCLUDED.project_name, contact_person = EXCLUDED.contact_person, contact_email = EXCLUDED.contact_email, contact_phone = EXCLUDED.contact_phone"
                      id,
                      (form-util/find-answer-value answers "project-name"),
                      (form-util/find-answer-value answers "applicant-name"),
                      (form-util/find-answer-value answers "primary-email"),
                      (form-util/find-answer-value answers "textField-0")]))
  (log/info (str "Succesfully stored normalized fields for hakemus with id: " id)))

(defn get-answers [form-submission-id form-submission-version]
  (log/info (str "Get answers for form submission: " form-submission-id " with version: " form-submission-version))
  (let [answers (jdbc/with-db-transaction [connection {:datasource (get-datasource)}]
                 (jdbc/query
                   connection
                   ["SELECT answers from hakija.form_submissions WHERE id = ? AND version = ?" form-submission-id, form-submission-version]
                  {:identifiers #(.replace % \_ \-)}))]
    (log/info (str "Succesfully fetched answers for form submission: " form-submission-id " with version: " form-submission-version))
    (:answers (first answers))))

(defn could-normalize-necessary-fields [hakemus]
  (let [id (:id hakemus)
        answers (get-answers (:form_submission_id hakemus) (:form_submission_version hakemus))]
  (try (store-normalized-hakemus id answers)
       true
       (catch Exception e
         (log/info "Could not normalize necessary hakemus fields for hakemus: " id " Error: " (.getMessage e))
         false))))


(defn send-muutoshakemus-paatos [to avustushaku hakemus arvio roles token muutoshakemus-id]
  (let [lang-str (:language hakemus)
        hakemus-id (:id hakemus)
        lang (keyword lang-str)
        muutoshakemus-paatos-url (paatos-url (:id avustushaku) (:user_key hakemus) lang)
        muutoshakemus-url (email/modify-url (:id avustushaku) (:user_key hakemus) lang token true)
        mail-subject (get-in mail-titles [:muutoshakemus-paatos lang])
        presenter-role-id (:presenter_role_id arvio)
        selected-presenter (first (filter #(= (:id %) presenter-role-id) roles))
        presenter (if (nil? selected-presenter) (first roles) selected-presenter)]
    (email/try-send-msg-once {
                          :type :muutoshakemus-paatos
                          :lang lang
                          :muutoshakemus-id muutoshakemus-id
                          :from (-> email/smtp-config :from lang)
                          :sender (-> email/smtp-config :sender)
                          :subject mail-subject
                          :presenter-name (:name presenter)
                          :to to
                          :hakemus-id hakemus-id
                          :paatos-url muutoshakemus-paatos-url
                          :muutoshakemus-url muutoshakemus-url
                          :register-number (:register_number hakemus)
                          :project-name (:project_name hakemus)}

                           (partial render (get-in mail-templates [:muutoshakemus-paatos lang])))))

(defn send-paatos! [to avustushaku hakemus reply-to]
  (let [lang-str (:language hakemus)
        lang (keyword lang-str)
        url (paatos-url (:id avustushaku) (:user_key hakemus) (keyword lang-str))
        avustushaku-name (get-in avustushaku [:content :name (keyword lang-str)])
        mail-subject (get-in mail-titles [:paatos lang])]
    (log/info "Url would be: " url)
    (email/try-send-msg-once {
                          :type :paatos
                          :lang lang
                          :from (-> email/smtp-config :from lang)
                          :reply-to reply-to
                          :sender (-> email/smtp-config :sender)
                          :subject mail-subject
                          :avustushaku-name avustushaku-name
                          :to to
                          :url url
                          :register-number (:register_number hakemus)
                          :project-name (:project_name hakemus)}

                           (partial render (get-in mail-templates [:paatos lang])))))

(defn could-normalize-necessary-fields [hakemus]
  (let [id (:id hakemus)
        answers (get-answers (:form_submission_id hakemus) (:form_submission_version hakemus))]
  (try (store-normalized-hakemus id answers)
       true
       (catch Exception e
         (log/info "Could not normalize necessary hakemus fields for hakemus: " id " Error: " (.getMessage e))
         false))))

(defn send-paatos-refuse! [to avustushaku hakemus reply-to token]
  (let [lang-str (:language hakemus)
        lang (keyword lang-str)
        url (paatos-url (:id avustushaku) (:user_key hakemus) (keyword lang-str))
        paatos-refuse-url
        (email/refuse-url (:id avustushaku) (:user_key hakemus) lang token)
        muutospaatosprosessi-enabled? (and
                                       (get-in config [:muutospaatosprosessi :enabled?])
                                       (could-normalize-necessary-fields hakemus))
        paatos-modify-url
        (email/modify-url (:id avustushaku) (:user_key hakemus) lang token muutospaatosprosessi-enabled?)
        avustushaku-name (get-in avustushaku [:content :name (keyword lang-str)])
        mail-subject (get-in mail-titles [:paatos lang])
        msg {
             :type :paatos-refuse
             :lang lang
             :from (-> email/smtp-config :from lang)
             :reply-to reply-to
             :sender (-> email/smtp-config :sender)
             :subject mail-subject
             :avustushaku-name avustushaku-name
             :to to
             :hakemus-id (:id hakemus)
             :url url
             :refuse-url paatos-refuse-url
             :modify-url paatos-modify-url
             :register-number (:register_number hakemus)
             :project-name (:project_name hakemus)
             :muutospaatosprosessi-enabled muutospaatosprosessi-enabled?}
        format-plaintext-message (partial render (get-in mail-templates [:paatos-refuse lang]))
        ]
    (log/info "Sending decision email with refuse link")
    (log/info "Urls would be: " url "\n" paatos-refuse-url)
    (email/try-send-msg-once msg format-plaintext-message)
    ))

(defn send-selvitys! [to hakemus mail-subject mail-message]
  (let [lang (keyword (:language hakemus))]
    (>!! email/mail-chan {:operation :send
                          :type :selvitys
                          :lang lang
                          :from (-> email/smtp-config :from lang)
                          :sender (-> email/smtp-config :sender)
                          :subject mail-subject
                          :to to
                          :body mail-message})))

(defn send-selvitys-notification! [to avustushaku hakemus selvitys-type arvio roles]
  (let [lang-str (:language hakemus)
        lang (keyword lang-str)
        presenter-role-id (:presenter_role_id arvio)
        url (selvitys-url (:id avustushaku) (:user_key hakemus) lang selvitys-type)
        avustushaku-name (get-in avustushaku [:content :name lang])
        mail-subject (str (get-in mail-titles [(keyword (str selvitys-type "-notification")) lang]) " " avustushaku-name)
        selected-presenter (first (filter #(= (:id %) presenter-role-id) roles))
        presenter (if (nil? selected-presenter) (first roles) selected-presenter)]
    (log/info "Url would be: " url)
    (>!! email/mail-chan {:operation :send
                          :type (keyword (str selvitys-type "-notification"))
                          :lang lang
                          :from (-> email/smtp-config :from lang)
                          :sender (-> email/smtp-config :sender)
                          :subject mail-subject
                          :selvitysdate ((keyword (str selvitys-type "date")) avustushaku)
                          :presenter-name (:name presenter)
                          :avustushaku-name avustushaku-name
                          :to to
                          :url url
                          :register-number (:register_number hakemus)
                          :project-name (:project_name hakemus)})))

(defn send-payments-info! [payments-info]
  (let [lang :fi
        grant-title (get-in payments-info [:title lang])
        mail-subject
        (format (get-in mail-titles [:payments-info-notification lang])
                grant-title)]
    (>!! email/mail-chan {:operation :send
                          :type :payments-info-notification
                          :lang lang
                          :from (-> email/smtp-config :from lang)
                          :sender (-> email/smtp-config :sender)
                          :subject mail-subject
                          :to (:receivers payments-info)
                          :date (:date payments-info)
                          :batch-key (:batch-key payments-info)
                          :count (:count payments-info)
                          :total-granted (:total-granted payments-info)})))
