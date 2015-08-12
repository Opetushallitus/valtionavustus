(ns oph.va.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [clj-time.core :as time]
            [clj-time.format :as time-format]
            [clojure.tools.trace :refer [trace]]
            [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [clostache.parser :refer [render]]
            [oph.common.config :refer [config]])
  (:import [org.apache.commons.mail SimpleEmail]))

(defn- load-template [path]
  (->> path
       io/resource
       slurp))

(def mail-titles
  {:new-hakemus {:fi "Linkki organisaationne avustushakemukseen"
                 :sv "TODO: Länk till bidragsansökan"}})

(def mail-templates
  {:new-hakemus {:fi (load-template "email-templates/new-hakemus.plain.fi")
                 :sv (load-template "email-templates/new-hakemus.plain.sv")}})

(def smtp-config (:email config))
(defonce mail-queue (chan 50))
(defonce run? (atom true))

(defn- try-send! [time multiplier max-time send-fn]
  (if (>= time max-time)
    (do
      (log/error "Failed to send message after retrying, aborting")
      false)
    (try
      (send-fn)
      (log/info "Message sent successfully")
      true
      (catch Exception e
        (.printStackTrace e)
        (log/warn (format "Error: %s" (.getMessage e)))
        (Thread/sleep time)
        (try-send! (* time multiplier) multiplier max-time send-fn)))))

(defn- send-msg! [msg format-plaintext-message]
  (let [from (:from msg)
        sender (:sender msg)
        to (:to msg)
        subject (:subject msg)]
    (log/info (format "Sending %s message from %s (with sender %s) to %s (lang: %s) with subject '%s'"
                      (name (:type msg))
                      from
                      sender
                      to
                      (name (:lang msg))
                      subject))
    (let [email (format-plaintext-message msg)
          send-fn (if (:enabled? smtp-config)
                    (fn []
                      (let [msg (SimpleEmail.)]
                        (doto msg
                          (.setHostName (:host smtp-config))
                          (.setSmtpPort (:port smtp-config))
                          (.setFrom from)
                          (.addHeader "Sender" sender)
                          (.setBounceAddress (:bounce-address smtp-config))
                          (.setSubject subject)
                          (.setMsg email)
                          (.addTo to)
                          (.send))))
                    (fn []
                      (log/info "Sending message: " email)))]
      (when (not (try-send! (:retry-initial-wait smtp-config)
                            (:retry-multiplier smtp-config)
                            (:retry-max-time smtp-config)
                            send-fn))
        (log/info (format "Failed to send %s message to %s (lang: %s) with subject '%s'"
                          (str (:type msg))
                          to
                          (:lang msg)
                          subject))))))

(defn start-background-sender []
  (reset! run? true)
  (go (log/info "Starting mail sender loop")
      (while (= @run? true)
        (let [msg (<! mail-queue)]
          (case (:operation msg)
            :stop (reset! run? false)
            :send (send-msg! msg
                             (partial render (get-in mail-templates [(:type msg) (:lang msg)]))))))
        (log/info "Exiting mail sender loop - mail sending is shut down")))

(defn stop-background-sender []
  (log/info "Signaling mail sender to stop")
  (>!! mail-queue {:operation :stop}))

(defn send-new-hakemus-message! [lang to avustushaku-id avustushaku user-key end-date]
  (let [lang-str (or (clojure.core/name lang) "fi")
        local-time-zone (time/time-zone-for-id "Europe/Helsinki")
        date-string (->> (time-format/formatter "dd.MM.YYYY" local-time-zone)
                         (.toString end-date))
        time-string (->> (time-format/formatter "HH:mm" local-time-zone)
                         (.toString end-date))
        url (str (-> config :server :url lang)
                 "?avustushaku="
                 avustushaku-id
                 "&hakemus="
                 user-key
                 "&lang="
                 lang-str)]
    (log/info "Url would be: " url)
    (>!! mail-queue {:operation :send
                     :type :new-hakemus
                     :lang lang
                     :from (-> smtp-config :from lang)
                     :sender (-> smtp-config :sender)
                     :subject (get-in mail-titles [:new-hakemus lang])
                     :to to
                     :avustushaku avustushaku
                     :end-date date-string
                     :end-time time-string
                     :url url})))
