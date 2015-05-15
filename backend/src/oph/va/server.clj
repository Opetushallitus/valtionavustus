(ns oph.va.server
  (:use [org.httpkit.server :only [run-server]]
        [oph.va.routes :only [all-routes]])
  (:require [ring.middleware.reload :as reload]
            [compojure.handler :refer [site]]
            [environ.core :refer [env]]))

(defn -main [& args]
  (let [auto-reload? (env :autoreload)
        port (env :port)
        host (env :host)
        handler (if auto-reload?
                  (reload/wrap-reload (site #'all-routes))
                  (site all-routes))]
    (println (format "Starting server in URL http://%s:%d/" host port))
    (run-server handler {:host host :port port})))
