(ns oph.va.server
  (:use [org.httpkit.server :only [run-server]])
  (:require [ring.middleware.reload :as reload]
            [compojure.handler :refer [site]]
            [compojure.core :refer :all]
            [compojure.route :as route]))

(defroutes all-routes
  (GET "/" [] "<h1>Hello world</h1>")
  (route/not-found "<p>Page not found.</p>"))

(defn in-dev? [& args] true)

(defn -main [& args]
  (let [handler (if (in-dev? args)
                  (reload/wrap-reload (site #'all-routes))
                  (site all-routes))]
    (run-server handler {:port 8080})))
