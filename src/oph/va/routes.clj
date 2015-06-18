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

(s/defschema AvustusHaku {:id Long
                          :content s/Any
                          :form Long
                          :submittime s/Inst})

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

(s/defschema HakemusId
  "Hakemus id contains id of the newly created hakemus"
  {:id s/Str})

(defn- create-form-submission [form-id answers]
  (let [submission (db/create-submission! form-id answers)]
    (if submission
      (ok submission)
      (internal-server-error!))))

(defn- get-form-submission [form-id values-id]
  (let [submission (db/get-form-submission form-id values-id)]
    (if submission
      (ok submission)
      (not-found))))

(defn- get-form-submission-versions [form-id values-id]
  (let [submission (db/get-form-submission-versions form-id values-id)]
    (if submission
      (ok submission)
      (not-found))))

(defn- update-form-submission [form-id values-id answers]
  (if (not (db/submission-exists? form-id values-id))
    (not-found)
    (let [submission (db/update-submission! form-id values-id answers)]
      (if submission
        (ok submission)
        (internal-server-error!)))))

(defroutes* form-routes
  "Form routes"

  (GET* "/" []
        :return [Form]
        (ok (db/list-forms)))

  (GET* "/:id" [id]
        :path-params [id :- Long]
        :return Form
        (let [form (db/get-form id)]
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
        (let [validation (validation/validate-form (db/get-form form-id) answers)]
          (if (every? empty? (vals validation))
            (create-form-submission form-id answers)
            (bad-request validation))))

  (POST* "/:form-id/values/:values-id" [form-id values-id :as request]
         :path-params [form-id :- Long, values-id :- Long]
         :body    [answers (describe Answers "New answers")]
         :return  (s/either Submission
                            SubmissionValidationErrors)
         :summary "Update form values"
         (let [validation (validation/validate-form (db/get-form form-id) answers)]
           (if (every? empty? (vals validation))
             (update-form-submission form-id values-id  answers)
             (bad-request validation)))))

(defroutes* avustushaku-routes
  "Avustushaku routes"

  (GET* "/:id" [id]
        :path-params [id :- Long]
        :return AvustusHaku
        (let [avustushaku (db/get-avustushaku id)]
          (if avustushaku
            (ok avustushaku)
            (not-found))))

  (GET* "/:haku-id/hakemus/:hakemus-id" [haku-id hakemus-id]
        :path-params [haku-id :- Long, hakemus-id :- s/Str]
        :return  Submission
        :summary "Get current answers"
        (let [form-id (:form (db/get-avustushaku haku-id))
              hakemus (db/get-hakemus hakemus-id)]
          (get-form-submission form-id (:form_submission_id hakemus))))

  (PUT* "/:haku-id/hakemus" [haku-id :as request]
      :path-params [haku-id :- Long]
      :body    [answers (describe Answers "New answers")]
      :return  HakemusId
      :summary "Create initial hakemus"
      (let [form-id (:form (db/get-avustushaku haku-id))
            validation (validation/validate-form-security (db/get-form form-id) answers)]
        (if (every? empty? (vals validation))
                    (let [hakemus-id (db/create-hakemus! form-id answers)]
                      (if hakemus-id
                        (ok hakemus-id)
                        (internal-server-error!)))
                    (bad-request validation))))

  (POST* "/:haku-id/hakemus/:hakemus-id" [haku-id hakemus-id :as request]
       :path-params [haku-id :- Long, hakemus-id :- s/Str]
       :body    [answers (describe Answers "New answers")]
       :return  Submission
       :summary "Update hakemus values"
       (let [form-id (:form (db/get-avustushaku haku-id))
             validation (validation/validate-form-security (db/get-form form-id) answers)]
         (if (every? empty? (vals validation))
           (let [hakemus (db/get-hakemus hakemus-id)]
             (update-form-submission form-id (:form_submission_id hakemus) answers))
           (bad-request validation))))

  (POST* "/:haku-id/hakemus/:hakemus-id/submit" [haku-id hakemus-id :as request]
       :path-params [haku-id :- Long, hakemus-id :- s/Str]
       :body    [answers (describe Answers "New answers")]
       :return  Submission
       :summary "Update hakemus values"
       (let [form-id (:form (db/get-avustushaku haku-id))
             validation (validation/validate-form (db/get-form form-id) answers)]
         (if (every? empty? (vals validation))
           (let [hakemus (db/get-hakemus hakemus-id)
                 saved-answers (update-form-submission form-id (:form_submission_id hakemus) answers)]
             (db/submit-hakemus hakemus-id)
             saved-answers)
           (bad-request validation)))))

(defroutes* api-routes
  "API implementation"

  ;; Bind form routes
  (context* "/form" [] :tags ["forms"] form-routes)

  ;; Bind avustushaku routes
  (context* "/avustushaku" [] :tags ["avustushaut"] avustushaku-routes))


(defroutes* doc-routes
  "API documentation browser"
  (swagger-ui))

(defapi all-routes
  {:formats [:json-kw]}

  ;; swagger.json generation
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name "forms"
                         :description "Form and form submission management"}
                        {:name "avustushaut"
                         :description "Avustushaku"}]})

  ;; Route all requests with API prefix to API routes
  (context "/api" [] api-routes)

  ;; Documentation
  (context "/doc" [] doc-routes)

  (GET "/" [](charset (content-type (resp/resource-response "index.html" {:root "public"}) "text/html") "utf-8"))
  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))
