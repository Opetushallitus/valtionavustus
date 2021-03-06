(ns oph.va.virkailija.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [oph.soresu.common.db :refer [query]]
            [clojure.java.jdbc :as jdbc]
            [oph.common.email :as email]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.tapahtumaloki :as tapahtumaloki]
            [clojure.tools.trace :refer [trace]]
            [clojure.tools.logging :as log]
            [clostache.parser :refer [render]])
  (:use [clojure.java.io]
        [oph.va.decision-liitteet]))

(def mail-titles
  {:change-request {:fi "Täydennyspyyntö avustushakemukseesi"
                    :sv "Begäran om komplettering av ansökan"}
   :paatos {:fi "Automaattinen viesti: organisaationne avustushakemus on käsitelty - Linkki päätösasiakirjaan"
            :sv "Automatiskt meddelande: Er ansökan om understöd har behandlats – Länk till beslutet"}
   :muutoshakemus-paatos {:fi "Automaattinen viesti: organisaationne muutoshakemus on käsitelty - Linkki päätösasiakirjaan"
            :sv "Automatiskt meddelande: Er ändringsansökan har behandlats - Länk till beslutet"}
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

(defn send-change-request-message! [lang to avustushaku-id hakemus-id avustushaku-name user-key change-request presenting-officer-email]
  (let [lang-str (or (clojure.core/name lang) "fi")
        url (email/generate-url avustushaku-id lang lang-str user-key false)]
    (log/info "Url would be: " url)
    (>!! email/mail-chan {:operation :send
                          :type :change-request
                          :lang lang
                          :hakemus-id hakemus-id
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

(defn stream-to-bytearray [is]
  (let [baos (java.io.ByteArrayOutputStream.)]
    (copy is baos)
    (let [bytearray (.toByteArray baos)]
      (log/info bytearray)
      bytearray)))

(defn read-oikaisuvaatimusosoitus-into-byte-array [attachment-id lang]
  (let [oikaisuvaatimus-pdf (resource  (str "public/liitteet/" attachment-id "_" (name lang) ".pdf"))]
    (with-open [in (input-stream oikaisuvaatimus-pdf)]
      (stream-to-bytearray in))))

(defn find-oikaisuvaatimusosoitus-attachments []
(:attachments (first (filter (fn [x] (= (:group x) "Oikaisuvaatimusosoitus")) Liitteet))))

(defn find-3a-oikaisuvaatimusosoitus-attachment []
  (first (filter #(= (:id %1) "3a_oikaisuvaatimusosoitus_valtionavustuslaki") (find-oikaisuvaatimusosoitus-attachments))))

(defn muutoshakemus-paatos-url [user-key lang]
  (let [va-url (-> config :server :url lang)
        lang-str (or (clojure.core/name lang) "fi")]
  (str va-url "muutoshakemus/paatos?user-key=" user-key "&lang=" lang-str)))

(defn send-muutoshakemus-paatos [to avustushaku hakemus arvio roles token muutoshakemus-id paatos]
  (let [lang-str (:language hakemus)
        hakemus-id (:id hakemus)
        lang (keyword lang-str)
        muutoshakemus-paatos-url (muutoshakemus-paatos-url (:user-key paatos) lang)
        muutoshakemus-url (email/modify-url (:id avustushaku) (:user_key hakemus) lang token true)
        mail-subject (get-in mail-titles [:muutoshakemus-paatos lang])
        presenter-role-id (:presenter_role_id arvio)
        oikaisuvaatimusosoitus (find-3a-oikaisuvaatimusosoitus-attachment)
        attachment-title (get (:langs oikaisuvaatimusosoitus) lang)
        attachment-contents (read-oikaisuvaatimusosoitus-into-byte-array (:id oikaisuvaatimusosoitus) lang)
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
                          :project-name (:project_name hakemus)
                          :attachment-title attachment-title
                          :attachment {:title attachment-title
                                       :description attachment-title
                                       :contents attachment-contents}}

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

(defn- has-multiple-menoluokka-rows [hakemus-id]
  (let [result (first (query "SELECT COUNT(id) FROM menoluokka_hakemus WHERE hakemus_id = ?" [hakemus-id]))]
    (> (:count result) 1)))

(defn- has-normalized-hakemus [hakemus-id]
  (let [result (first (query "SELECT COUNT(id) FROM normalized_hakemus WHERE hakemus_id = ?" [hakemus-id]))]
    (> (:count result) 0)))

(defn should-include-muutoshaku-link-in-paatos-email? [avustushaku hakemus-id]
  (and
    (get-in config [:muutospaatosprosessi :enabled?])
    (:muutoshakukelpoinen avustushaku)
    (has-normalized-hakemus hakemus-id)))

(defn send-paatos-refuse! [to avustushaku hakemus reply-to token]
  (let [lang-str (:language hakemus)
        lang (keyword lang-str)
        url (paatos-url (:id avustushaku) (:user_key hakemus) (keyword lang-str))
        paatos-refuse-url (email/refuse-url (:id avustushaku) (:user_key hakemus) lang token)
        budjettimuutoshakemus-enabled? (has-multiple-menoluokka-rows (:id hakemus))
        include-muutoshaku-link? (should-include-muutoshaku-link-in-paatos-email? avustushaku (:id hakemus))
        paatos-modify-url (email/modify-url (:id avustushaku) (:user_key hakemus) lang token include-muutoshaku-link?)
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
             :budjettimuutoshakemus-enabled budjettimuutoshakemus-enabled?
             :include-muutoshaku-link include-muutoshaku-link?}
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

(defn send-selvitys-notification! [to avustushaku hakemus selvitys-type arvio roles uuid identity]
  (let [lang-str (:language hakemus)
        lang (keyword lang-str)
        type (str selvitys-type "-notification")
        presenter-role-id (:presenter_role_id arvio)
        url (selvitys-url (:id avustushaku) (:user_key hakemus) lang selvitys-type)
        avustushaku-name (get-in avustushaku [:content :name lang])
        mail-subject (str (get-in mail-titles [(keyword type) lang]) " " avustushaku-name)
        selected-presenter (first (filter #(= (:id %) presenter-role-id) roles))
        presenter (if (nil? selected-presenter) (first roles) selected-presenter)]
    (log/info "Url would be: " url)
    (tapahtumaloki/create-log-entry type (:id avustushaku) (:id hakemus) identity uuid to true)
    (>!! email/mail-chan {:operation :send
                          :hakemus-id (:id hakemus)
                          :avustushaku-id (:id avustushaku)
                          :type (keyword type)
                          :lang lang
                          :from (-> email/smtp-config :from lang)
                          :sender (-> email/smtp-config :sender)
                          :subject mail-subject
                          :selvitysdate ((keyword (str selvitys-type "date")) avustushaku)
                          :presenter-name (:name presenter)
                          :avustushaku-name avustushaku-name
                          :to to
                          :bcc (:email identity)
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
