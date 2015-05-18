(ns oph.va.routes
  (:require [compojure.route :as route]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [GET]]
            [compojure.api.sweet :refer :all]
            [schema.core :as s]))

(defroutes* api-routes
  (GET* "/" []
        :return )
  (GET* "/plus" []
        :return Long
        :query-params [x :- Long, {y :- Long 1}]
        :summary "x+y with query-parameters. y defaults to 1."
        (ok (+ x y)))

  (POST* "/minus" []
         :return      Long
         :body-params [x :- Long, y :- Long]
         :summary     "x-y with body-parameters."
         (ok (- x y)))

  ;; API documentation browser
  (swagger-ui))

(defapi all-routes

  ;; swagger.json generation
  (swagger-docs {:info {:title "Valtionavustus API"}})

  ;; Route all requests with API prefix to API routes
  (context "/api" [] api-routes)

  (GET "/" [] (resp/resource-response "index.html" {:root "public"}))
  (route/resources "/")
  (route/not-found "<p>Page not found.</p>"))
