(ns va-payments-ui.dev-server
    (:require [compojure.core :refer :all]
            [compojure.route :as route]
            [ring.middleware.reload :refer [wrap-reload]]
            [ring.middleware.defaults :refer [wrap-defaults site-defaults]]
            [ring.util.response :as response]))

(defroutes app-routes
 (route/resources "/" {:root "public"})
  (GET "/*" [] (->
                 (response/file-response "/index.html" {:root "public"})
                 (response/content-type "text/html")))
  (route/not-found "Not Found"))

(def dev-app (wrap-reload (wrap-defaults #'app-routes site-defaults)))
