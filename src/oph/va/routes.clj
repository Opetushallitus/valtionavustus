(ns oph.va.routes
  (:require [compojure.route :as route]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [GET]]
            [compojure.api.sweet :refer :all]
            [schema.core :as s]
            [oph.va.db :as db]))

(s/defschema LocalizedString {:fi s/Str
                              :sv s/Str})

(s/defschema FormField {:label LocalizedString
                        :description LocalizedString
                        :type (s/enum :text-field
                                      :text-area
                                      :check-box
                                      :radio-button)})

(s/defschema Form {:name LocalizedString
                   :fields [FormField]})

(s/defschema User {:name s/Str
                   :sex (s/enum :male :female)
                   :address {:street s/Str
                             :zip s/Str}})

(defroutes* api-routes
  "API implementation"

  (GET* "/" []
        :return {:id Long, :name String}
        (ok {:id 1, :name "lolbal"}))

  (GET* "/dbdata" []
        :return [{:id Long,
                  :metadata s/Any
                  :start (s/maybe org.joda.time.DateTime)}]
        (ok (db/run-query)))

  (GET* "/form" []
        :return Form
        (ok {:name {:fi "Lol Bal"
                    :sv "Lol bal sv"}
             :fields [{:label {:fi "Kenttä"
                               :sv "Kenttä"}
                       :description {:fi "Kuvaus"
                                     :sv "Kuvaus"}
                       :type :text-field}]}))

  (GET* "/user" []
        :return User
        (ok {:name "Lol Bal"
             :sex :male
             :address {:street "Foobar"
                       :zip "00100"}}))

  (GET* "/plus" []
        :return Long
        :query-params [x :- Long, {y :- Long 1}]
        :summary "x+y with query-parameters. y defaults to 1."
        (ok (+ x y)))

  (POST* "/minus" []
         :return      Long
         :body-params [x :- Long, y :- Long]
         :summary     "x-y with body-parameters."
         (ok (- x y))))

(defroutes* doc-routes
  "API documentation browser"
  (swagger-ui))

(defapi all-routes

  ;; swagger.json generation
  (swagger-docs {:info {:title "Valtionavustus API"}})

  ;; Route all requests with API prefix to API routes
  (context "/api" [] api-routes)

  ;; Documentation
  (context "/doc" [] doc-routes)

  (GET "/" [] (resp/resource-response "index.html" {:root "public"}))
  (route/resources "/")
  (route/not-found "<p>Page not found.</p>"))
