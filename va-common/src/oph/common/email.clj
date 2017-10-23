(ns oph.common.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [clojure.tools.trace :refer [trace]]
            [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [clostache.parser :refer [render]]
            [oph.soresu.common.config :refer [config]]
            [oph.common.string :as common-string]
            [oph.common.background-job-supervisor :as job-supervisor])
  (:import [org.apache.commons.mail SimpleEmail]))

(defn load-template [path]
  (->> path
       io/resource
       slurp))

(def smtp-config (:email config))

(def mail-chan (chan (:queue-size smtp-config)))

(defn- try-send! [time multiplier max-time send-fn]
  (if (>= time max-time)
    (do
      (log/warn (format "Aborting sending message after too many failures (%d of %d ms)"
                        time
                        max-time))
      false)
    (try
      (send-fn)
      true
      (catch Exception e
        (log/warn e (format "Error in sending, trying again (%d of %d ms): %s"
                            time
                            max-time
                            (.getMessage e)))
        (Thread/sleep time)
        (try-send! (* time multiplier) multiplier max-time send-fn)))))

(defn- trim-ws-or-nil [str]
  (when str
    (common-string/trim-ws str)))

(defn- send-msg! [msg format-plaintext-message]
  (let [from            (common-string/trim-ws (:from msg))
        sender          (common-string/trim-ws (:sender msg))
        to              (mapv common-string/trim-ws (:to msg))
        bcc             (trim-ws-or-nil (:bcc msg))
        reply-to        (trim-ws-or-nil (:reply-to msg))
        subject         (common-string/trim-ws (:subject msg))
        msg-description (format "%s message from %s (with sender %s) to %s (lang: %s) with subject '%s'"
                                (name (:type msg))
                                from
                                sender
                                to
                                (name (:lang msg))
                                subject)]
    (log/info "Sending email:" msg-description)
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
                          (.setMsg email))
                        (when reply-to
                          (.addReplyTo msg reply-to))
                        (when bcc
                          (.addBcc msg bcc))
                        (doseq [address to]
                          (.addTo msg address))
                        (.send msg)))
                    (fn []
                      (when (:print-mail-on-disable? smtp-config)
                        (log/info "Would have sent email:" email))))]
      (when (not (try-send! (:retry-initial-wait smtp-config)
                            (:retry-multiplier smtp-config)
                            (:retry-max-time smtp-config)
                            send-fn))
        (log/error "Failed sending email:" msg-description)))))

(defn start-loop-send-mails [mail-templates]
  (go
    (log/info "Starting background job: send mails...")
    (loop []
      (let [msg   (<! mail-chan)
            stop? (case (:operation msg)
                    :stop true
                    :send (do
                            (send-msg! msg
                                       (partial render (get-in mail-templates [(:type msg) (:lang msg)])))
                            false))]
        (if (not stop?)
          (recur))))
    (log/info "Stopped background job: send mails.")))

(defn start-background-job-send-mails [mail-templates]
  (job-supervisor/start-background-job :send-mails
                                       (partial start-loop-send-mails mail-templates)
                                       #(>!! mail-chan {:operation :stop})))

(defn stop-background-job-send-mails []
  (job-supervisor/stop-background-job :send-mails))

(defn generate-url [avustushaku-id lang lang-str user-key preview?]
  (str (-> config :server :url lang)
       (if (= lang :sv)
         "statsunderstod/"
         "avustushaku/")
       avustushaku-id
       "/"
       (if (= lang :sv)
         "visa"
         "nayta")
       "?hakemus="
       user-key
       "&lang="
       lang-str
       (if preview?
         "&preview=true"
         "")))

(defn generate-virkailija-url [avustushaku-id hakemus-db-id]
  (str (-> config :server :virkailija-url)
       "/avustushaku/"
       avustushaku-id
       "/hakemus/"
       hakemus-db-id
       "/"))
