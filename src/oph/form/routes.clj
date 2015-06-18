(ns oph.form.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [compojure.route :as route]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [GET]]
            [compojure.api.sweet :refer :all]
            [schema.core :as s]
            [oph.form.db :as form-db]
            [oph.va.db :as va-db]
            [oph.form.validation :as validation]))

(s/defschema LocalizedString {:fi s/Str
                              :sv s/Str})

(s/defschema Option {:value s/Str
                     (s/optional-key :label) LocalizedString})

(s/defschema InfoElement {:type (s/eq "infoElement")
                          :id s/Str
                          :displayAs (s/enum :h1
                                             :bulletList
                                             :dateRange
                                             :endOfDateRange)
                          (s/optional-key :params) s/Any
                          (s/optional-key :label) LocalizedString})

(s/defschema FormField {:type (s/eq "formField")
                        :id s/Str
                        :required s/Bool
                        :label LocalizedString
                        (s/optional-key :params) s/Any
                        (s/optional-key :options) [Option]
                        :displayAs (s/enum :textField
                                           :textArea
                                           :emailField
                                           :dropdown
                                           :radioButton)})

(s/defschema BasicElement (s/either FormField
                                    InfoElement))

(s/defschema WrapperElement {:type (s/eq "wrapperElement")
                             :id s/Str
                             :displayAs (s/enum :theme
                                                :fieldset)
                             :children  [(s/either BasicElement
                                                   (s/recursive #'WrapperElement))]
                             (s/optional-key :params) s/Any
                             (s/optional-key :label) LocalizedString})

(s/defschema Content [(s/either BasicElement
                                WrapperElement)])

(s/defschema Form {:id Long,
                   :content Content,
                   :start s/Inst})

(s/defschema Answers
  "Answers consists of a flat field id to value mapping"
  {s/Keyword s/Str})

(s/defschema Submission {:id Long
                         :submittime s/Inst
                         :form Long
                         :version Long
                         :version_closed (s/maybe s/Inst)
                         :answers Answers})

(s/defschema SubmissionValidationErrors
  "Submission validation errors contain a mapping from field id to list of validation errors"
  {s/Keyword [s/Str]})

(defn create-form-submission [form-id answers]
  (let [submission (form-db/create-submission! form-id answers)]
    (if submission
      (ok submission)
      (internal-server-error!))))

(defn get-form-submission [form-id values-id]
  (let [submission (form-db/get-form-submission form-id values-id)]
    (if submission
      (ok submission)
      (not-found))))

(defn get-form-submission-versions [form-id values-id]
  (let [submission (form-db/get-form-submission-versions form-id values-id)]
    (if submission
      (ok submission)
      (not-found))))

(defn update-form-submission [form-id values-id answers]
  (if (not (form-db/submission-exists? form-id values-id))
    (not-found)
    (let [submission (form-db/update-submission! form-id values-id answers)]
      (if submission
        (ok submission)
        (internal-server-error!)))))

(defroutes* form-routes
  "Form routes"

  (GET* "/" []
        :return [Form]
        (ok (form-db/list-forms)))

  (GET* "/:id" [id]
        :path-params [id :- Long]
        :return Form
        (let [form (form-db/get-form id)]
          (if form
            (ok form)
            (not-found))))

  (GET* "/:form-id/values/:values-id" [form-id values-id]
        :path-params [form-id :- Long, values-id :- Long]
        :return  Submission
        :summary "Get current answers"
        (get-form-submission form-id values-id))

  (GET* "/:form-id/values/:values-id/versions" [form-id values-id]
        :path-params [form-id :- Long, values-id :- Long]
        :return  [Submission]
        :summary "Get all versions of submitted answers"
        (get-form-submission-versions form-id values-id))

  (PUT* "/:form-id/values" [form-id :as request]
        :path-params [form-id :- Long]
        :body    [answers (describe Answers "New answers")]
        :return  (s/either Submission
                           SubmissionValidationErrors)
        :summary "Create initial form answers"
        (let [validation (validation/validate-form (form-db/get-form form-id) answers)]
          (if (every? empty? (vals validation))
            (create-form-submission form-id answers)
            (bad-request validation))))

  (POST* "/:form-id/values/:values-id" [form-id values-id :as request]
         :path-params [form-id :- Long, values-id :- Long]
         :body    [answers (describe Answers "New answers")]
         :return  (s/either Submission
                            SubmissionValidationErrors)
         :summary "Update form values"
         (let [validation (validation/validate-form (form-db/get-form form-id) answers)]
           (if (every? empty? (vals validation))
             (update-form-submission form-id values-id  answers)
             (bad-request validation)))))
