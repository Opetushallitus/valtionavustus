(ns oph.va.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [clojure.tools.trace :refer [trace]]
            [postal.core :refer [send-message]]
            [clostache.parser :refer [render]]
            [oph.common.config :refer [config]]))

(def html-activation-template (slurp "resources/email-templates/activation.html"))
(def plain-activation-template (slurp "resources/email-templates/activation.plain"))

(def smtp-config (:email config))
(def mail-queue (chan 50))
(def run? (atom true))

(defn- send-msg! [msg to-plain to-html]
  (let [from (:from smtp-config)
        to (:to msg)
        subject (:subject msg)]
    (println "Sending message")
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
           (.printStackTrace e)))))

(defn start-background-sender []
  (reset! run? true)
  (go (while (= @run? true)
        (let [msg (<! mail-queue)]
          (case (:type msg)
            :stop (reset! run? false)
            :activation (send-msg! msg
                                   (partial render plain-activation-template)
                                   (partial render html-activation-template)))))
      (println "Exiting mail sender")))

(defn stop-background-sender []
  (>!! mail-queue {:type :stop}))

(defn send-activation-message! [to]
  (if (:enabled? smtp-config)
    (>!! mail-queue {:type :activation
                     :to to
                     :subject "TBD"
                     :name "Lol"})
    (println "Mail sending disabled, skipping")))
