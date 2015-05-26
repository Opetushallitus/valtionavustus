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

(s/defschema FormField {:id s/Str
                        :label LocalizedString
                        :description LocalizedString
                        :displayAs (s/enum :textField
                                           :textArea)})

(s/defschema Form {:name LocalizedString
                   :fields [FormField]})

(s/defschema User {:name s/Str
                   :sex (s/enum :male :female)
                   :address {:street s/Str
                             :zip s/Str}})

(def form {:name {:fi "Testilomake"
                  :sv "Testform"}
           :fields [{:id "nimi"
                     :label {:fi "Nimi"
                             :sv "Namn"}
                     :description {:fi "Hakijan nimi"
                                   :sv "Den sökandes namn"}
                     :displayAs :textField}
                    {:id "osoite"
                     :label {:fi "Katuosoite"
                             :sv "Gatuaddress"}
                     :description {:fi "Hakijan katuosoite"
                                   :sv "Den sökandes gatuaddress"}
                     :displayAs :textField}
                    {:id "kuvaus"
                     :label {:fi "Kuvaus"
                             :sv "Beskrivning"}
                     :description {:fi ""
                                   :sv ""}
                     :displayAs :textArea}]})

(defroutes* api-routes
  "API implementation"

  (GET* "/dbdata" []
        :return [{:id Long,
                  :metadata s/Any
                  :start (s/maybe s/Inst)}]
        (ok (db/run-query)))

  (GET* "/form" []
        :return Form
        (ok form))

  (GET* "/user" []
        :return User
        (ok {:name "Lol Bal"
             :sex :male
             :address {:street "Foobar"
                       :zip "00100"}}))

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

  (GET "/" [](charset (content-type (resp/resource-response "index.html" {:root "public"}) "text/html") "utf-8"))
  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))