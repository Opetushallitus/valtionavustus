(ns oph.form.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [compojure.route :as route]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [GET]]
            [compojure.api.sweet :refer :all]
            [schema.core :as s]
            [oph.form.db :as form-db]
            [oph.form.schema :refer :all]
            [oph.form.validation :as validation]))

(create-form-schema [])

(defn create-form-submission [form-id answers]
  (let [submission (form-db/create-submission! form-id answers)]
    (if submission
      (ok submission)
      (internal-server-error!))))

(defn get-form-submission [form-id values-id]
  (let [submission (form-db/get-form-submission form-id values-id)]
    (if submission
      (ok submission)
      (not-found!))))

(defn get-form-submission-versions [form-id values-id]
  (let [submission (form-db/get-form-submission-versions form-id values-id)]
    (if submission
      (ok submission)
      (not-found!))))

(defn update-form-submission [form-id values-id answers]
  (if (not (form-db/submission-exists? form-id values-id))
    (not-found!)
    (let [submission (form-db/update-submission! form-id values-id answers)]
      (if submission
        (ok submission)
        (internal-server-error!)))))

(defroutes* form-restricted-routes
  "Restricted form routes"

  (GET* "/:id" [id]
        :path-params [id :- Long]
        :return Form
        (let [form (form-db/get-form id)]
          (if form
            (ok form)
            (not-found)))))

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
        (let [validation (validation/validate-form (form-db/get-form form-id) answers {})]
          (if (every? empty? (vals validation))
            (create-form-submission form-id answers)
            (bad-request! validation))))

  (POST* "/:form-id/values/:values-id" [form-id values-id :as request]
         :path-params [form-id :- Long, values-id :- Long]
         :body    [answers (describe Answers "New answers")]
         :return  (s/either Submission
                            SubmissionValidationErrors)
         :summary "Update form values"
         (let [validation (validation/validate-form (form-db/get-form form-id) answers {})]
           (if (every? empty? (vals validation))
             (update-form-submission form-id values-id  answers)
             (bad-request! validation)))))
