(ns oph.va.virkailija.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [oph.common.email :as email]
            [clojure.tools.trace :refer [trace]]
            [clojure.tools.logging :as log]))

(def mail-titles
  {:change-request {:fi "Täydennyspyyntö avustushakemukseesi"
                    :sv "Begäran om komplettering av ansökan"}})

(def mail-templates
  {:change-request {:fi (email/load-template "email-templates/change-request.plain.fi")
                    :sv (email/load-template "email-templates/change-request.plain.sv")}})

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
