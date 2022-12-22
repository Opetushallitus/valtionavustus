(ns oph.common.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
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

(def smtp-config
  (when-not *compile-files*
    (:email config)))

(def mail-chan (chan (:queue-size smtp-config)))

(def contact-email-field-id "primary-email")
(def legacy-email-field-ids
  ["organization-email" contact-email-field-id "signature-email"])
(def legacy-email-field-ids-without-contact-email
  (remove #(= contact-email-field-id %) legacy-email-field-ids))

(defn- trim-ws-or-nil [str]
  (when str
    (common-string/trim-ws str)))

(defn simple-or-not [{:keys [attachment]}]
  (if attachment
    (MultiPartEmail.)
    (SimpleEmail.)))

(defn- msg->description [{:keys [from sender to subject type lang]}]
  (let [from (or from sender)
        type (name type)
        lang (name lang)]
    (format "%s message from %s (with sender %s) to %s (lang: %s) with subject '%s'"
            type
            from
            sender
            to
            lang
            subject)))

(defn- valid-message? [{:keys [to sender from subject type lang]}]
  [(coll? to)
   (not-any? empty? to)
   (not-empty sender)
   (not-empty from)
   (not-empty subject)
   (not-empty (name type))
   (not-empty (name lang))])

(defn store-email [{:keys [to sender from subject type lang bcc reply-to attachment]}
                   email-msg]
  {:pre (conj [(valid-message? {:from    from
                                :sender  sender
                                :to      to
                                :subject subject
                                :type    type
                                :lang    lang})]
              (not-empty email-msg))}
  (let [from (common-string/trim-ws from)
        sender (common-string/trim-ws sender)
        to (mapv common-string/trim-ws to)
        bcc (trim-ws-or-nil bcc)
        reply-to (trim-ws-or-nil reply-to)
        subject (common-string/trim-ws subject)]
    (log/info "Storing email: " (msg->description {:from    from
                                                   :sender  sender
                                                   :to      to
                                                   :subject subject
                                                   :type    type
                                                   :lang    lang}))
    (let [result (query "INSERT INTO virkailija.email (formatted, from_address, sender, to_address, bcc, reply_to, subject, attachment_contents, attachment_title, attachment_description)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id"
                        [email-msg from sender to bcc reply-to subject (:contents attachment) (:title attachment) (:description attachment)])
          email_id (:id (first result))]
      (log/info (str "Succesfully stored email with id: " email_id))
      email_id)))


(defn create-mail-send-fn [{:keys [from sender to bcc reply-to subject attachment lang]} email-msg]
  (let [from (common-string/trim-ws from)
        sender (common-string/trim-ws sender)
        to (mapv common-string/trim-ws to)
        bcc (trim-ws-or-nil bcc)
        reply-to (trim-ws-or-nil reply-to)
        subject (common-string/trim-ws subject)
        description (msg->description {:from from
                                       :sender sender
                                       :to to
                                       :subject subject
                                       :type type
                                       :lang lang})]
    (log/info "Sending email:" description)
    (let [make-email-obj (fn []
                           (let [msg (simple-or-not {:attachment attachment})]
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
      [description send-fn])))

(defn create-email-event [email-id success {:keys [type hakemus-id avustushaku-id muutoshakemus-id]}]
  (try
    (log/info "Storing email event for email: " email-id)
    (execute! "INSERT INTO virkailija.email_event (avustushaku_id, hakemus_id, muutoshakemus_id, email_id, email_type, success)
                 VALUES (?, ?, ?, ?, ?::virkailija.email_type, ?)"
              [avustushaku-id hakemus-id muutoshakemus-id email-id (name type) success])
    (log/info (str "Succesfully stored email event for email: " email-id))
    (catch Exception e
      (log/error (str "Failed to store email event for email: " email-id)))))

(defn try-send-msg [{:keys [to from sender subject bcc type reply-to attachment hakemus-id avustushaku-id muutoshakemus-id lang]}
                    body
                    email-id]
  {:pre [(valid-message? {:from    from
                          :sender  sender
                          :to      to
                          :subject subject
                          :type    type
                          :lang    lang})]}
  (let [email-event {:type             type
                     :hakemus-id       hakemus-id
                     :avustushaku-id   avustushaku-id
                     :muutoshakemus-id muutoshakemus-id}
        message {:to         to
                 :from       from
                 :sender     sender
                 :bcc        bcc
                 :reply-to   reply-to
                 :subject    subject
                 :attachment attachment
                 :lang       lang}
        [_ send-fn] (create-mail-send-fn message body)]
    (try
      (send-fn)
      (create-email-event email-id true email-event)
      (catch Exception e
        (log/info e (format "Failed to send message: %s" (.getMessage e)))
        (create-email-event email-id false email-event)
        (throw e)))))

(defn try-send-msg-once
  ([msg format-plaintext-message]
   (let [body (format-plaintext-message msg)
         email-id (store-email msg body)]
     (try-send-msg-once msg body email-id)))
  ([msg body email-id]
    (try (try-send-msg msg body email-id)
      ;; just log info here as the retry mechanism will alert if sending fails enough times
      (catch Exception e
        (log/info e "Tried to send email:" email-id)))))

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
                              (try-send-msg-once (:msg msg) (:body msg) (:email-id msg))
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

(defn- render-body [msg]
  (let [template (get-in @mail-templates [(:type msg) (:lang msg)])]
    (render template msg)))

(defn enqueue-message-to-be-send [msg]
  (let [body (render-body msg)
        email-id (store-email msg body)]
    (>!! mail-chan {:operation :send, :msg msg, :body body, :email-id email-id})))

(defn- get-messages-that-failed-to-send []
  (query "SELECT * FROM (
            SELECT DISTINCT ON (e.id)
              e.id AS email_id,
              e.formatted,
              e.from_address as from,
              e.sender,
              e.to_address as to,
              e.bcc,
              e.reply_to,
              e.subject,
              e.attachment_contents,
              e.attachment_title,
              e.attachment_description,
              ee.email_type as type,
              'fi' as lang,
              ee.success,
              e.created_at as first_created_at,
              e.created_at + interval '1 hour' < now() as over_hour_old
            FROM email e
            JOIN email_event ee ON e.id = ee.email_id
            ORDER BY e.id, ee.created_at DESC
          ) AS r
          WHERE r.success = false" []))

(defn retry-sending-failed-emails []
  (log/info "Looking for email messages that failed to be sent")
  (let [messages (get-messages-that-failed-to-send)]
    (log/info "Found" (count messages) "email messages that failed to be sent")
    (doseq [msg messages]
      (let [body (:formatted msg)
            email-id (:email-id msg)
            over-hour-old (:over-hour-old msg)
            first-created-at (:first-created-at msg)]
        (try
          (try-send-msg msg body email-id)
          (catch Exception e
            (if over-hour-old
              ;; fluentbit sends an alarm to pagerduty from error level logs
              (log/error e "Failed to send email for 60 minutes:" email-id first-created-at)
              (log/info e "Failed to send email:" email-id first-created-at))))))))
