(ns oph.common.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [clojure.tools.trace :refer [trace]]
            [clojure.java.jdbc :as jdbc]
            [clojure.tools.logging :as log]
            [clojure.string :as string]
            [clojure.java.io :as io]
            [clostache.parser :refer [render]]
            [oph.soresu.common.config :refer [config]]
            [oph.soresu.common.db :refer [query execute!]]
            [oph.common.email-utils :as email-utils]
            [oph.common.string :as common-string]
            [oph.common.background-job-supervisor :as job-supervisor])
  (:import [org.apache.commons.mail SimpleEmail]
           [org.apache.commons.mail MultiPartEmail]
           [org.apache.commons.mail ByteArrayDataSource]
           [java.io ByteArrayInputStream]))

(defn load-template [path]
  (->> path
       io/resource
       slurp))

(defn smtp-config
  (when-not *compile-files*
    (:email config)))

(def mail-chan (chan (:queue-size smtp-config)))

(def contact-email-field-id "primary-email")
(def legacy-email-field-ids
  ["organization-email" contact-email-field-id "signature-email"])
(def legacy-email-field-ids-without-contact-email
  (remove #(= contact-email-field-id %) legacy-email-field-ids))

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

(defn simple-or-not [msg]
  (if (:attachment msg)
    (MultiPartEmail.)
    (SimpleEmail.)))

(defn store-email [msg format-plaintext-message]
  (let [from            (common-string/trim-ws (:from msg))
    sender          (common-string/trim-ws (:sender msg))
    to              (mapv common-string/trim-ws (:to msg))
    bcc             (trim-ws-or-nil (:bcc msg))
    reply-to        (trim-ws-or-nil (:reply-to msg))
    subject         (common-string/trim-ws (:subject msg))
    attachment      (:attachment msg)
    msg-description (format "%s message from %s (with sender %s) to %s (lang: %s) with subject '%s'"
                            (name (:type msg))
                            from
                            sender
                            to
                            (name (:lang msg))
                            subject)
      email-msg (format-plaintext-message msg)]
  (log/info "Storing email: " msg-description)
  (let [result (query "INSERT INTO virkailija.email (formatted, from_address, sender, to_address, bcc, reply_to, subject, attachment_contents, attachment_title, attachment_description)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id"
                      [email-msg from sender to bcc reply-to subject (:contents attachment) (:title attachment) (:description attachment)])
        email_id (:id (first result))]
    (log/info (str "Succesfully stored email with id: " email_id))
    email_id)))

(defn create-mail-send-fn [msg format-plaintext-message]
    (let [from          (common-string/trim-ws (:from msg))
        sender          (common-string/trim-ws (:sender msg))
        to              (mapv common-string/trim-ws (:to msg))
        bcc             (trim-ws-or-nil (:bcc msg))
        reply-to        (trim-ws-or-nil (:reply-to msg))
        subject         (common-string/trim-ws (:subject msg))
        attachment      (:attachment msg)
        msg-description (format "%s message from %s (with sender %s) to %s (lang: %s) with subject '%s'"
                                (name (:type msg))
                                from
                                sender
                                to
                                (name (:lang msg))
                                subject)]
    (log/info "Sending email:" msg-description)
    (let [email-msg (format-plaintext-message msg)
          make-email-obj (fn []
                           (let [msg (simple-or-not msg)]
                             (doto msg
                               (.setHostName (:host smtp-config))
                               (.setSmtpPort (:port smtp-config))
                               (.setFrom from)
                               (.addHeader "Sender" sender)
                               (.setBounceAddress (:bounce-address smtp-config))
                               (.setSubject subject)
                               (.setMsg email-msg))
                             (when reply-to
                               (.addReplyTo msg reply-to))
                             (when bcc
                               (.addBcc msg bcc))
                             (when attachment
                               (let [is (ByteArrayInputStream. (:contents attachment))
                                     ds (ByteArrayDataSource. is, "application/pdf")]
                                 (.attach msg ds (:title attachment) (:description attachment))))
                             (doseq [address to]
                               (.addTo msg address))
                             msg))
          send-fn (if (:enabled? smtp-config)
                    (fn []
                      (.send (make-email-obj)))
                    (fn []
                      (when (:print-mail-on-disable? smtp-config)
                        (let [email-obj (make-email-obj)]
                          (log/infof (string/join "\n"
                                                  ["Would have sent email:"
                                                   "----"
                                                   "hostname: %s"
                                                   "smtp port: %s"
                                                   "to: %s"
                                                   "bcc: %s"
                                                   "from: %s"
                                                   "reply-to: %s"
                                                   "bounce address: %s"
                                                   "other headers: %s"
                                                   "subject: %s"
                                                   "\n%s"
                                                   "----"])
                                     (.getHostName email-obj)
                                     (.getSmtpPort email-obj)
                                     (.getToAddresses email-obj)
                                     (.getBccAddresses email-obj)
                                     (.getFromAddress email-obj)
                                     (.getReplyToAddresses email-obj)
                                     (.getBounceAddress email-obj)
                                     (.getHeaders email-obj)
                                     (.getSubject email-obj)
                                     email-msg)))))]
      [msg-description send-fn])))

(defn- create-email-event [email-id success msg]
  (let [msg-type (:type msg)
        hakemus-id (:hakemus-id msg)
        avustushaku-id (:avustushaku-id msg)
        muutoshakemus-id (:muutoshakemus-id msg)]
  (log/info "Storing email event for email: " email-id)
  (execute! "INSERT INTO virkailija.email_event (avustushaku_id, hakemus_id, muutoshakemus_id, email_id, email_type, success)
             VALUES (?, ?, ?, ?, ?::virkailija.email_type, ?)"
            [avustushaku-id hakemus-id muutoshakemus-id email-id (name msg-type) success])
  (log/info (str "Succesfully stored email event for email: " email-id))))

(defn- send-msg! [msg format-plaintext-message email-id]
  (let [[msg-description send-fn] (create-mail-send-fn msg format-plaintext-message)]
    (if (not (try-send! (:retry-initial-wait smtp-config)
                          (:retry-multiplier smtp-config)
                          (:retry-max-time smtp-config)
                          send-fn))
      ((log/error "Failed sending email:" msg-description)
       (create-email-event email-id false msg))
      (create-email-event email-id true msg))))

(defn try-send-msg-once [msg format-plaintext-message]
  (let [[msg-description send-fn] (create-mail-send-fn msg format-plaintext-message)
        email-id (store-email msg format-plaintext-message)]
    (try
      (send-fn)
      (create-email-event email-id true msg)
      (catch Exception e
        (log/error e (format "Failed to send message: %s" (.getMessage e)))
        (create-email-event email-id false msg)
        (throw e)))))

(def mail-templates (atom {}))

(defn start-loop-send-mails [new-templates]
  (swap! mail-templates (fn [old  new] (merge old new)) new-templates)
  (go
    (log/info "Starting background job: send mails...")
    (loop []
      (let [msg   (<! mail-chan)
            stop? (case (:operation msg)
                    :stop true
                    :send (do
                            (try
                              (send-msg! (:msg msg) (:format-plaintext-message msg) (:email-id msg))
                            (catch Exception e
                              (log/error e "Failed to send email")))
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

(defn refuse-url [avustushaku-id user-key lang token]
  (email-utils/refuse-url
   (get-in config [:server :url lang]) avustushaku-id user-key lang token))

(defn modify-url [avustushaku-id user-key lang token include-muutoshaku-link?]
  (email-utils/modify-url
   (get-in config [:server :url lang]) avustushaku-id user-key lang token include-muutoshaku-link?))

(defn enqueue-message-to-be-send [msg]
  (let [format-plaintext-message (partial render (get-in @mail-templates [(:type msg) (:lang msg)]))
        email-id (store-email msg format-plaintext-message)]
    (>!! mail-chan {:operation :send, :msg msg, :format-plaintext-message format-plaintext-message, :email-id email-id})))
