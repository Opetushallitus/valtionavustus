(ns oph.va.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
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

(def mail-templates
  {:activation {:html {:fi (load-template "email-templates/activation.html.fi")
                       :sv (load-template "email-templates/activation.html.sv")}
                :plain {:fi (load-template "email-templates/activation.plain.fi")
                        :sv (load-template "email-templates/activation.plain.sv")}}})

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


(defn- send-msg! [msg to-plain to-html]
  (let [from (:from smtp-config)
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
                 :body [:alternative
                        {:type "text/plain; charset=utf-8"
                         :content (to-plain msg)}
                        {:type "text/html; charset=utf-8"
                         :content (to-html msg)}]}
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
                             (partial render (get-in mail-templates [(:type msg) :plain (:lang msg)]))
                             (partial render (get-in mail-templates [(:type msg) :html (:lang msg)]))))))
        (log/info "Exiting mail sender loop - mail sending is shut down")))

(defn stop-background-sender []
  (log/info "Signaling mail sender to stop")
  (>!! mail-queue {:operation :stop}))

(defn send-activation-message! [lang to name avustushaku-id user-key]
  (let [lang-str (or (clojure.core/name lang) "fi")
        url (str (-> config :server :url)
                 "?avustushaku"
                 avustushaku-id
                 "&hakemus="
                 user-key
                 "&lang="
                 lang-str)]
    (log/info "Url would be: " url)
    (>!! mail-queue {:operation :send
                   :type :activation
                   :lang lang
                   :subject "TBD"
                   :to to
                   :name name
                   :url url})))
