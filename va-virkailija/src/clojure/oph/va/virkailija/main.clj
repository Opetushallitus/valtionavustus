(ns oph.va.virkailija.main
  (:require [clojure.tools.logging :as log]
            [nrepl.server :as nrepl-server]
            [oph.soresu.common.config :refer [config without-authentication?]]
            [oph.va.virkailija.server :refer [start-server]])
  (:gen-class))

(defn write-nrepl-port-file [port]
  (with-open [w (clojure.java.io/writer  ".nrepl-port")]
    (.write w (str port))))

(defn run-nrepl []
  (require 'cider.nrepl)
  (let [nrepl-port 7888
        nrepl-handler (ns-resolve 'cider.nrepl 'cider-nrepl-handler)]
    (nrepl-server/start-server :port nrepl-port :handler nrepl-handler)
    (write-nrepl-port-file nrepl-port)
    (log/info "nrepl running on port " nrepl-port)))

(defn -main [& _args]
  (let [server-config (:server config)
        auto-reload? (:auto-reload? server-config)
        port (:port server-config)
        host (:host server-config)]

    (if (:nrepl-enabled? config) (run-nrepl))

    (let [stop-server (start-server {:host host
                                     :port port
                                     :auto-reload? auto-reload?
                                     :without-authentication? (without-authentication?)})]
      (.addShutdownHook (Runtime/getRuntime) (Thread. stop-server)))))