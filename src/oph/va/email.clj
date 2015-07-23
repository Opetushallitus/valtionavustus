(ns oph.va.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [clojure.tools.trace :refer [trace]]
            [clojure.tools.logging :as log]
            [postal.core :refer [send-message]]
            [clostache.parser :refer [render]]
            [oph.common.config :refer [config]]))

(def mail-templates
  {:activation {:html {:fi (slurp "resources/email-templates/activation.html.fi")
                       :sv (slurp "resources/email-templates/activation.html.sv")}
                :plain {:fi (slurp "resources/email-templates/activation.plain.fi")
                        :sv (slurp "resources/email-templates/activation.plain.sv")}}})

(def smtp-config (:email config))
(def mail-queue (chan 50))
(def run? (atom true))

(defn- send-msg! [msg to-plain to-html]
  (let [from (:from smtp-config)
        to (:to msg)
        subject (:subject msg)]
    (log/info (format "Sending %s message to %s with subject '%s'"
                      (:type msg)
                      to
                      subject))
    (try (send-message smtp-config
                       {:from from
                        :to to
                        :subject subject
                        :body [:alternative
                               {:type "text/plain"
                                :content (to-plain msg)}
                               {:type "text/html"
                                :content (to-html msg)}]})
         (catch Exception e
           (log/error e)))))

(defn start-background-sender []
  (reset! run? true)
  (go (log/info "Starting mail sender loop")
      (while (= @run? true)
        (let [msg (<! mail-queue)]
          (case (:operation msg)
            :stop (reset! run? false)
            :send (send-msg! msg
                             (partial render (get-in mail-templates [(:type msg) :plain (:lang msg)]))
                             (partial render (get-in mail-templates [(:type msg) :plain (:lang msg)]))))))
        (log/info "Exiting mail sender loop - mail sending is shut down")))

(defn stop-background-sender []
  (log/info "Signaling mail sender to stop")
  (>!! mail-queue {:operation :stop}))

(defn send-activation-message! [lang to]
  (if (:enabled? smtp-config)
    (>!! mail-queue {:operation :send
                     :type :activation
                     :lang lang
                     :subject "TBD"
                     :to to
                     :name "Lol"})
    (log/info "Mail sending disabled, skipping")))
