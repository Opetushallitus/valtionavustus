(ns oph.va.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [clj-time.format :as clj-time]
            [clojure.tools.trace :refer [trace]]
            [clojure.tools.logging :as log]
            [clojure.java.io :as io]
            [postal.core :refer [send-message]]
            [clostache.parser :refer [render]]
            [oph.common.config :refer [config]]))

(defn- load-template [path]
  (->> path
       io/resource
       slurp))

(def mail-titles
  {:new-hakemus {:fi "Linkki avustushakemukseen"
                 :sv "TODO: Länk till bidragsansökan"}})

(def mail-templates
  {:new-hakemus {:fi (load-template "email-templates/new-hakemus.plain.fi")
                 :sv (load-template "email-templates/new-hakemus.plain.sv")}})

(def smtp-config (trace "smtp-config" (:email config)))
(defonce mail-queue (chan 50))
(defonce run? (atom true))

(defn- try-send! [time multiplier max-time send-fn]
  (if (>= time max-time)
    (do
      (log/error "Failed to send message after retrying, aborting")
      false)
    (let [{:keys [code error message]} (send-fn)]
      (if (= code 0)
        (do
          (log/info "Message sent successfully")
          true)
        (do
          (log/warn (format "Error: %d %s - %s" code (str error) message))
          (Thread/sleep time)
          (try-send! (* time multiplier) multiplier max-time send-fn))))))


(defn- send-msg! [msg format-plaintext-message]
  (let [from (:from msg)
        sender (:sender msg)
        to (:to msg)
        subject (:subject msg)]
    (log/info (format "Sending %s message to %s (lang: %s) with subject '%s'"
                      (name (:type msg))
                      to
                      (name (:lang msg))
                      subject))
    (let [email {:from from
                 :to to
                 :subject subject
                 :body (format-plaintext-message msg)}
          send-fn (if (:enabled? smtp-config)
                    (fn []
                      (send-message smtp-config email))
                    (fn []
                      (log/info "Sending message: " email)
                      {:code 0 :error nil :message nil}))]
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
        url (str (-> config :server :url lang)
                 "?avustushaku"
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
                     :end-date (clj-time/unparse (clj-time/formatter "dd.MM.YYYY") end-date)
                     :url url})))
