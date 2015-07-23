(ns oph.va.email
  (:require [clojure.core.async :refer [<! >!! go chan]]
            [clojure.tools.trace :refer [trace]]
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
          (case (:operation msg)
            :stop (reset! run? false)
            :send (send-msg! msg
                             (partial render (get-in mail-templates [(:type msg) :plain (:lang msg)]))
                             (partial render (get-in mail-templates [(:type msg) :plain (:lang msg)]))))))
      (println "Exiting mail sender")))

(defn stop-background-sender []
  (>!! mail-queue {:operation :stop}))

(defn send-activation-message! [lang to]
  (if (:enabled? smtp-config)
    (>!! mail-queue {:operation :send
                     :type :activation
                     :lang lang
                     :subject "TBD"
                     :to to
                     :name "Lol"})
    (println "Mail sending disabled, skipping")))
