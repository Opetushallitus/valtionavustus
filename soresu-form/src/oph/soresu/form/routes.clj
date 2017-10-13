(ns oph.soresu.form.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.api.sweet :as compojure-api]
            [schema.core :as s]
            [oph.soresu.form.db :as form-db]
            [oph.soresu.form.schema :refer :all]
            [oph.soresu.form.validation :as validation]
            [oph.soresu.form.formhandler :as formhandler]))

(defn without-id [x]
  (dissoc x :id))

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

(defn- form-to-return [form]
  (->> form
       (without-id)
       (formhandler/add-koodisto-values :form-db)))

(compojure-api/defroutes form-restricted-routes
  "Restricted form routes"

  (compojure-api/GET "/:id" [id]
    :path-params [id :- Long]
    :return Form
    (let [form (form-db/get-form id)]
      (if form
        (ok (form-to-return form))
        (not-found)))))

(compojure-api/defroutes form-routes
  "Form routes"

  (compojure-api/GET "/" []
    :return [Form]
    (ok (form-db/list-forms)))

  (compojure-api/GET "/:id" [id]
    :path-params [id :- Long]
    :return Form
    (let [form (form-db/get-form id)]
      (if form
        (ok (form-to-return form))
        (not-found))))

  (compojure-api/GET "/:form-id/values/:values-id" [form-id values-id]
    :path-params [form-id :- Long, values-id :- Long]
    :return  Submission
    :summary "Get current answers"
    (get-form-submission form-id values-id))

  (compojure-api/GET "/:form-id/values/:values-id/versions" [form-id values-id]
    :path-params [form-id :- Long, values-id :- Long]
    :return  [Submission]
    :summary "Get all versions of submitted answers"
    (get-form-submission-versions form-id values-id))

  (compojure-api/PUT "/:form-id/values" [form-id :as request]
    :path-params [form-id :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  (s/if error-type?
               SubmissionValidationErrors
               Submission)
    :summary "Create initial form answers"
    (let [validation (validation/validate-form (form-db/get-form form-id) answers {})]
      (if (every? empty? (vals validation))
        (create-form-submission form-id answers)
        (bad-request! validation))))

  (compojure-api/POST "/:form-id/values/:values-id" [form-id values-id :as request]
    :path-params [form-id :- Long, values-id :- Long]
    :body    [answers (compojure-api/describe Answers "New answers")]
    :return  (s/if error-type?
               SubmissionValidationErrors
               Submission)
    :summary "Update form values"
    (let [validation (validation/validate-form (form-db/get-form form-id) answers {})]
      (if (every? empty? (vals validation))
        (update-form-submission form-id values-id  answers)
        (bad-request! validation)))))
