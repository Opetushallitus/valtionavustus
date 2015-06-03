(ns oph.va.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [compojure.route :as route]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [GET]]
            [compojure.api.sweet :refer :all]
            [schema.core :as s]
            [oph.va.db :as db]
            [oph.va.validation :as validation]))

(s/defschema LocalizedString {:fi s/Str
                              :sv s/Str})

(s/defschema Option {:value s/Str
                     (s/optional-key :label) LocalizedString})

(s/defschema InfoElement {:type (s/eq :infoElement)
                          :id s/Str})

(s/defschema FormField {:type (s/eq :formField)
                        :id s/Str
                        :required s/Bool
                        :label LocalizedString
                        (s/optional-key :params) s/Any
                        (s/optional-key :options) [Option]
                        :displayAs (s/enum :textField
                                           :textArea
                                           :dropdown
                                           :radioButton)})

(s/defschema Content [(s/either FormField
                                InfoElement)])

(s/defschema Form {:id Long,
                   :content Content,
                   :start s/Inst})

(s/defschema Submission
  "Submission consists of a flat field id to value mapping"
  {s/Keyword s/Str})

(s/defschema SubmissionValidationErrors
  "Submission validation errors contain a mapping from field id to list of validation errors"
  {s/Keyword [s/Str]})

(s/defschema SubmissionId
  "Submission id contains id of the newly created submission"
  {:id Long})

(def empty-answers {})

(defroutes* api-routes
  "API implementation"

  (GET* "/form" []
        :return [Form]
        (ok (db/list-forms)))

  (GET* "/form/:id" [id]
        :path-params [id :- Long]
        :return Form
        (let [form (db/get-form (Long. id))]
          (if form
            (ok form)
            (not-found id))))

  (GET* "/form/:form-id/values/:values-id" [form-id values-id]
        :path-params [form-id :- Long, values-id :- Long]
        :return  Submission
        :summary "Get current answers"
        (let [submission (db/get-form-submission form-id values-id)]
          (if submission
            (ok (:answers submission))
            (ok empty-answers))))

  (PUT* "/form/:form-id/values" [form-id :as request]
        :path-params [form-id :- Long]
        :body    [answers (describe Submission "New answers")]
        :return  (s/either SubmissionId
                           SubmissionValidationErrors)
        :summary "Create initial form answers"
        (let [validation (validation/validate-form (db/get-form form-id) answers)]
          (if (every? empty? (vals validation))
            (let [submission (db/create-submission! form-id answers)]
              (if submission
                (ok submission)
                (internal-server-error!)))
            (bad-request validation))))

  (POST* "/form/:form-id/values/:values-id" [form-id values-id :as request]
         :path-params [form-id :- Long, values-id :- Long]
         :body    [answers (describe Submission "New answers")]
         :return  (s/either Submission
                            SubmissionValidationErrors)
         :summary "Update form values"
         (if (not (db/submission-exists? form-id values-id))
           (not-found)
           (let [validation (validation/validate-form (db/get-form form-id) answers)]
             (if (every? empty? (vals validation))
               (let [submission (db/update-submission! form-id values-id answers)]
                 (if submission
                   (ok submission)
                   (internal-server-error!)))
               (bad-request validation))))))

(defroutes* doc-routes
  "API documentation browser"
  (swagger-ui))

(defapi all-routes
  {:formats [:json-kw]}

  ;; swagger.json generation
  (swagger-docs {:info {:title "Valtionavustus API"}})

  ;; Route all requests with API prefix to API routes
  (context "/api" [] api-routes)

  ;; Documentation
  (context "/doc" [] doc-routes)

  (GET "/" [](charset (content-type (resp/resource-response "index.html" {:root "public"}) "text/html") "utf-8"))
  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))
