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
            :sv "SV Automaattinen viesti: organisaationne avustushakemus on käsitelty - Linkki päätösasiakirjaan"}
  })

(def mail-templates
  {:change-request {:fi (email/load-template "email-templates/change-request.plain.fi")
                    :sv (email/load-template "email-templates/change-request.plain.sv")}
   :paatos {:fi (email/load-template "email-templates/paatos.plain.fi")
           :sv (email/load-template "email-templates/paatos.plain.sv")}})

(defn mail-example [msg-type & [data]]
  {:content (render (:fi (msg-type mail-templates)) (if data data {}))
   :subject (:fi (msg-type mail-titles))
   :sender (-> email/smtp-config :sender)})

(defn start-background-sender []
  (email/start-background-sender mail-templates))

(defn stop-background-sender []
  (email/stop-background-sender))

(defn send-change-request-message! [lang to avustushaku-id avustushaku-name user-key change-request]
  (let [lang-str (or (clojure.core/name lang) "fi")
        url (email/generate-url avustushaku-id lang lang-str user-key false)]
    (log/info "Url would be: " url)
    (>!! email/mail-queue {:operation :send
                           :type :change-request
                           :lang lang
                           :from (-> email/smtp-config :from lang)
                           :sender (-> email/smtp-config :sender)
                           :subject (get-in mail-titles [:change-request lang])
                           :to [to]
                           :avustushaku avustushaku-name
                           :url url
                           :change-request change-request})))

(defn paatos-url [avustushaku-id hakemus-id]
  (let [virkailija-url (-> config :server :virkailija-url)]
  (str virkailija-url "/public/paatos/avustushaku/" avustushaku-id "/hakemus/" hakemus-id)
))

(defn send-paatos! [lang to avustushaku hakemus]
  (let [lang-str (or (clojure.core/name lang) "fi")
        url (paatos-url (:id avustushaku) (:id hakemus))
        avustushaku-name (get-in avustushaku [:content :name (keyword lang-str)])
        mail-subject (get-in mail-titles [:paatos lang])
        ]
    (log/info "Url would be: " url)
    (>!! email/mail-queue {:operation :send
                           :type :paatos
                           :lang lang
                           :from (-> email/smtp-config :from lang)
                           :sender (-> email/smtp-config :sender)
                           :subject mail-subject
                           :avustushaku-name avustushaku-name
                           :to to
                           :url url})))
