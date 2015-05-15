(ns oph.va.routes
  (:use [liberator.core :only [defresource]])
  (:require [compojure.route :as route]
            [compojure.core :refer :all]))

(defresource hello-world
  :available-media-types ["application/json"]
  :handle-ok {:testing {:val "1-2-3"}})

(defroutes all-routes
  (ANY "/" [] hello-world)
  (route/not-found "<p>Page not found.</p>"))
