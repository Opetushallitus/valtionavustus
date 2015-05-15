(ns oph.va.server
  (:use [org.httpkit.server :only [run-server]]
        [oph.va.routes :only [all-routes]])
  (:require [ring.middleware.reload :as reload]
            [compojure.handler :refer [site]]
            [environ.core :refer [env]]))

(defn start-server [host port auto-reload?]
  (let [handler (if auto-reload?
                  (reload/wrap-reload (site #'all-routes))
                  (site all-routes))]
    (run-server handler {:host host :port port})))

(defn -main [& args]
  (let [auto-reload? (env :auto-reload?)
        port (env :port)
        host (env :host)]
    (println (format "Starting server in URL http://%s:%d/" host port))
    (start-server host port auto-reload?)))
