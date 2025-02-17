(ns oph.soresu.form.routes
  (:require [ring.util.http-response :as http]
            [compojure.api.sweet :as compojure-api]
            [schema.core :as s]
            [oph.soresu.form.db :as form-db]
            [oph.soresu.form.schema :refer [Answers Form Submission SubmissionValidationErrors error-type?]]
            [oph.soresu.form.validation :as validation]
            [oph.soresu.form.formhandler :as formhandler]))

(defn without-id [x]
  (dissoc x :id))

(defn create-form-submission [form-id answers]
  (let [submission (form-db/create-submission! form-id answers)]
    (if submission
      (http/ok submission)
      (http/internal-server-error!))))

(defn get-form-submission [form-id values-id]
  (let [submission (form-db/get-form-submission form-id values-id)]
    (if submission
      (http/ok submission)
      (http/not-found!))))

(defn get-form-submission-versions [form-id values-id]
  (let [submission (form-db/get-form-submission-versions form-id values-id)]
    (if submission
      (http/ok submission)
      (http/not-found!))))

(defn update-form-submission [form-id values-id answers]
  (if (not (form-db/submission-exists? form-id values-id))
    (http/not-found!)
    (let [submission (form-db/update-submission! form-id values-id answers)]
      (if submission
        (http/ok submission)
        (http/internal-server-error!)))))

(defn- form-to-return [form]
  (->> form
       (without-id)
       (formhandler/add-koodisto-values)))

(def form-restricted-routes
  "Restricted form routes"
  (compojure-api/routes
   (compojure-api/GET "/:id" [id]
     :path-params [id :- Long]
     :return Form
     (let [form (form-db/get-form id)]
       (if form
         (http/ok (form-to-return form))
         (http/not-found))))))

(def form-routes
  "Form routes"
  (compojure-api/routes

   (compojure-api/GET "/" []
     :return [Form]
     (http/ok (form-db/list-forms)))

   (compojure-api/GET "/:id" [id]
     :path-params [id :- Long]
     :return Form
     (let [form (form-db/get-form id)]
       (if form
         (http/ok (form-to-return form))
         (http/not-found))))

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
         (http/bad-request! validation))))

   (compojure-api/POST "/:form-id/values/:values-id" [form-id values-id :as request]
     :path-params [form-id :- Long, values-id :- Long]
     :body    [answers (compojure-api/describe Answers "New answers")]
     :return  (s/if error-type?
                SubmissionValidationErrors
                Submission)
     :summary "Update form values"
     (let [validation (validation/validate-form (form-db/get-form form-id) answers {})]
       (if (every? empty? (vals validation))
         (update-form-submission form-id values-id answers)
         (http/bad-request! validation))))))
