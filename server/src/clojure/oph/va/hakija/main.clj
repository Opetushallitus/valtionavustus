(ns oph.va.hakija.main
  (:require [oph.va.hakija.server :refer [start-hakija-server]]
            [oph.va.virkailija.server :refer [start-virkailija-server]]
            [clojure.tools.logging :as log]
            [nrepl.server :as nrepl-server]
            [oph.soresu.common.config :refer [config without-authentication?]])
  (:gen-class))

(defn write-nrepl-port-file [port]
  (with-open [w (clojure.java.io/writer ".nrepl-port")]
    (.write w (str port))))

(defn run-nrepl []
  (require 'cider.nrepl)
  (let [nrepl-port 7999
        nrepl-handler (ns-resolve 'cider.nrepl 'cider-nrepl-handler)]
    (nrepl-server/start-server :port nrepl-port :handler nrepl-handler :bind "0.0.0.0")
    (write-nrepl-port-file nrepl-port)
    (log/info "nrepl running on port " nrepl-port)))

(defn -main [& args]
  (let [server-config (:server config)
        auto-reload? (:auto-reload? server-config)
        hakija-port (-> server-config :hakija-port)
        hakija-host (:virkailija-host server-config)
        virkailija-host (:virkailija-host server-config)
        virkailija-port (-> server-config :virkailija-port)]
    (if (:nrepl-enabled? config) (run-nrepl))
    (let [stop-hakija-server (start-hakija-server hakija-host hakija-port auto-reload?)
          stop-virkailija-server (start-virkailija-server {:host                    virkailija-host
                                                           :port                    virkailija-port
                                                           :auto-reload?            auto-reload?
                                                           :without-authentication? (without-authentication?)})]
      (.addShutdownHook (Runtime/getRuntime) (Thread. stop-hakija-server))
      (.addShutdownHook (Runtime/getRuntime) (Thread. stop-virkailija-server)))))
