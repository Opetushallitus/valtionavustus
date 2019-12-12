(ns oph.va.virkailija.main
  (:use [oph.va.virkailija.server :only [start-server]])
  (:require [oph.soresu.common.config :refer [config environment without-authentication?]])
  (:gen-class))

(defn -main [& args]
  (let [server-config (:server config)
        auto-reload? (:auto-reload? server-config)
        port (:port server-config)
        host (:host server-config)]

    (start-server {:host host
                   :port port
                   :auto-reload? auto-reload?
                   :without-authentication? (without-authentication?)})))
