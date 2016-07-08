(ns oph.va.virkailija.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [oph.common.email :as email]
            [oph.soresu.common.config :refer [config]]
            [clojure.tools.trace :refer [trace]]
            [clojure.tools.logging :as log]
            [clostache.parser :refer [render]]))

(def mail-titles
  {:change-request {:fi "Täydennyspyyntö avustushakemukseesi"
                    :sv "Begäran om komplettering av ansökan"}
   :paatos {:fi "Automaattinen viesti: organisaationne avustushakemus on käsitelty - Linkki päätösasiakirjaan"
            :sv "Automatiskt meddelande: Er ansökan om understöd har behandlats – Länk till beslutet"}
   :selvitys {:fi "Väliselvitys hyväksytty"
              :sv "Mellanredovisning godkänt"}
   :valiselvitys-notification {:fi "Väliselvitys täytettävissä haulle"
                               :sv "Mellanredovisningnen redo att fyllas"}
   :loppuselvitys-notification {:fi "Loppuselvitys täytettävissä haulle"
                                :sv "Slutredovisningen redo att fyllasSELV"}
   })

(def mail-templates
  {:change-request {:fi (email/load-template "email-templates/change-request.plain.fi")
                    :sv (email/load-template "email-templates/change-request.plain.sv")}
   :paatos {:fi (email/load-template "email-templates/paatos.plain.fi")
            :sv (email/load-template "email-templates/paatos.plain.sv")}
   :selvitys {:fi (email/load-template "email-templates/selvitys.plain.fi")
              :sv (email/load-template "email-templates/selvitys.plain.sv")}
   :valiselvitys-notification {:fi (email/load-template "email-templates/valiselvitys-notification.plain.fi")
                               :sv (email/load-template "email-templates/valiselvitys-notification.plain.sv")}
   :loppuselvitys-notification {:fi (email/load-template "email-templates/loppuselvitys-notification.plain.fi")
                                :sv (email/load-template "email-templates/loppuselvitys-notification.plain.sv")}

   })

(defn mail-example [msg-type & [data]]
  {:content (render (:fi (msg-type mail-templates)) (if data data {}))
   :subject (:fi (msg-type mail-titles))
   :sender (-> email/smtp-config :sender)})

(defn start-background-sender []
  (email/start-background-sender mail-templates))

(defn stop-background-sender []
  (email/stop-background-sender))

(defn send-change-request-message! [lang to avustushaku-id avustushaku-name user-key change-request presenting-officer-email]
  (let [lang-str (or (clojure.core/name lang) "fi")
        url (email/generate-url avustushaku-id lang lang-str user-key false)]
    (log/info "Url would be: " url)
    (>!! email/mail-queue {:operation :send
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

(defn send-paatos! [lang to avustushaku hakemus reply-to]
  (let [lang-str (or (clojure.core/name lang) "fi")
        url (paatos-url (:id avustushaku) (:user_key hakemus) (keyword lang-str))
        avustushaku-name (get-in avustushaku [:content :name (keyword lang-str)])
        mail-subject (get-in mail-titles [:paatos lang])]
    (log/info "Url would be: " url)
    (>!! email/mail-queue {:operation :send
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
                           :project-name (:project_name hakemus)})))


(defn send-selvitys! [to message]
  (let [lang :fi
        mail-subject (get-in mail-titles [:paatos lang])]
    (>!! email/mail-queue {:operation :send
                           :type :selvitys
                           :lang lang
                           :from (-> email/smtp-config :from lang)
                           :sender (-> email/smtp-config :sender)
                           :subject mail-subject
                           :to to
                           :body message
                           })))

(defn send-selvitys-notification! [lang to avustushaku hakemus selvitys-type arvio roles]
  (let [lang-str (or (clojure.core/name lang) "fi")
        presenter-role-id (:presenter_role_id arvio)
        url (selvitys-url (:id avustushaku) (:user_key hakemus) (keyword lang-str) selvitys-type)
        avustushaku-name (get-in avustushaku [:content :name (keyword lang-str)])
        mail-subject (str (get-in mail-titles [(keyword (str selvitys-type "-notification")) lang]) " " avustushaku-name)
        selected-presenter (first (filter #(= (:id %) presenter-role-id) roles))
        presenter (if (nil? selected-presenter) (first roles) selected-presenter)]
    (log/info "Url would be: " url)
    (println presenter-role-id)
    (println roles)
    (>!! email/mail-queue {:operation :send
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
