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

(s/defschema Option {:value s/Str
                     (s/optional-key :label) LocalizedString})

(s/defschema FormField {:id s/Str
                        :required s/Bool
                        :label LocalizedString
                        (s/optional-key :params) s/Any
                        (s/optional-key :options) [Option]
                        :displayAs (s/enum :textField
                                           :textArea
                                           :dropdown
                                           :radioButton)})

(s/defschema FormContent {:name LocalizedString
                          :fields [FormField]})

(s/defschema Form {:id Long,
                   :content FormContent,
                   :start s/Inst})

(def empty-answers {})

(defroutes* api-routes
  "API implementation"

  (GET* "/form" []
        :return [Form]
        (ok (db/execute-list-forms)))

  (GET* "/form/:id" [id]
        :return Form
        (let [form (db/get-form (Long. id))]
          (if form
            (ok form)
            (not-found id))))

  (GET* "/form/:form-id/values/:values-id" [form-id values-id]
        :return  s/Any
        :summary "Get current answers"
        (let [submission (db/get-form-submission (Long. form-id))]
          (if submission
            (ok (:answers submission))
            (ok empty-answers))))

  (PUT* "/form/:id/values" [id :as request]
         :return  Long
         :summary "Create initial form answers"
         (let [submission (db/submit-form! (Long. form_id) (:params request))]
           (if submission
             (ok (:answers submission))
             (ok empty-answers))))

  (POST* "/form/:form-id/values/:values-id" [form-id values-id :as request]
         :return  Long
         :summary "Update form values"
         (ok (db/submit-form! (Long. form-id)
                              (:params request)))))

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
