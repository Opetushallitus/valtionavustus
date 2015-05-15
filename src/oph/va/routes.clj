(ns oph.va.routes
  (:use [liberator.core :only [defresource]])
  (:require [compojure.route :as route]
            [compojure.core :refer :all]
            [ring.util.response :as resp]))

(defresource hello-world
  :available-media-types ["application/json"]
  :handle-ok {:testing {:val "1-2-3"}})

(defresource hello-test
  :available-media-types ["application/json"]
  :handle-ok {:test2 {:values [1 2 3 4]}})

(defn api-routes []
  (routes (ANY "/test" [] hello-test)
          (ANY "/" [] hello-world)))

(defroutes all-routes
  ;; Route all requests with API prefix to API routes
  (context "/api" [] (api-routes))

  (GET "/" [] (resp/resource-response "index.html" {:root "public"}))
  (route/resources "/")
  (route/not-found "<p>Page not found.</p>"))
