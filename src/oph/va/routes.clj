(ns oph.va.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [compojure.route :as route]
            [clojure.tools.logging :as log]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [GET]]
            [compojure.api.sweet :refer :all]
            [schema.core :as s]
            [oph.common.config :refer [config]]
            [oph.common.datetime :as datetime]
            [oph.form.db :as form-db]
            [oph.form.validation :as validation]
            [oph.form.routes :refer :all]
            [oph.form.schema :refer :all]
            [oph.va.db :as va-db]
            [oph.va.email :as va-email]
            [oph.va.schema :refer :all]))

(create-form-schema [:vaBudget
                     :vaSummingBudgetElement
                     :vaBudgetItemElement
                     :vaBudgetSummaryElement
                     :vaProjectDescription])

(defn- matches-key? [key value-container]
  (= (:key value-container) key))

(defn- find-hakemus-value [answers key]
  (->> answers
       :value
       (filter (partial matches-key? key))
       first
       :value))

(defn hakemus-ok-response [hakemus submission]
  (ok {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
       :status (:status hakemus)
       :version (:version hakemus)
       :last_status_change_at (:last_status_change_at hakemus)
       :submission submission}))

(defroutes* avustushaku-routes
  "Avustushaku routes"

  (GET* "/:id" [id]
        :path-params [id :- Long]
        :return AvustusHaku
        (if-let [avustushaku (va-db/get-avustushaku id)]
          (ok avustushaku)
          (not-found)))

  (GET* "/:haku-id/hakemus/:hakemus-id" [haku-id hakemus-id]
        :path-params [haku-id :- Long, hakemus-id :- s/Str]
        :return  Hakemus
        :summary "Get current answers"
        (let [form-id (:form (va-db/get-avustushaku haku-id))
              hakemus (va-db/get-hakemus hakemus-id)
              submission-id (:form_submission_id hakemus)
              submission (get-form-submission form-id submission-id)]
          (if (= (:status hakemus) "new") (va-db/verify-hakemus hakemus-id))
          (hakemus-ok-response hakemus (:body submission))))

  (PUT* "/:haku-id/hakemus" [haku-id :as request]
      :path-params [haku-id :- Long]
      :body    [answers (describe Answers "New answers")]
      :return  Hakemus
      :summary "Create initial hakemus"
      (let [avustushaku (va-db/get-avustushaku haku-id)
            avustushaku-content (:content avustushaku)
            form-id (:form avustushaku)
            form (form-db/get-form form-id)
            validation (validation/validate-form-security form answers)]
        (if (every? empty? (vals validation))
          (if-let [new-hakemus (va-db/create-hakemus! form-id answers)]
            (do (let [language (keyword (find-hakemus-value answers "language"))
                      avustushaku-title (-> avustushaku-content :name language)
                      avustushaku-duration (->> avustushaku-content
                                                :duration)
                      avustushaku-start-date (->> avustushaku-duration
                                                  :start
                                                  (datetime/parse))
                      avustushaku-end-date (->> avustushaku-duration
                                                :end
                                                (datetime/parse))
                      email (find-hakemus-value answers "primary-email")
                      user-key (-> new-hakemus :hakemus :user_key)]
                  (va-email/send-new-hakemus-message! language
                                                      email
                                                      haku-id
                                                      avustushaku-title
                                                      user-key
                                                      avustushaku-start-date
                                                      avustushaku-end-date))
                (hakemus-ok-response (:hakemus new-hakemus) (:submission new-hakemus)))
            (internal-server-error!))
          (bad-request! validation))))

  (POST* "/:haku-id/hakemus/:hakemus-id" [haku-id hakemus-id :as request]
       :path-params [haku-id :- Long, hakemus-id :- s/Str]
       :body    [answers (describe Answers "New answers")]
       :return  Hakemus
       :summary "Update hakemus values"
       (let [form-id (:form (va-db/get-avustushaku haku-id))
             validation (validation/validate-form-security (form-db/get-form form-id) answers)]
         (if (every? empty? (vals validation))
           (let [hakemus (va-db/get-hakemus hakemus-id)]
             (hakemus-ok-response hakemus (:body (update-form-submission form-id (:form_submission_id hakemus) answers))))
           (bad-request! validation))))

  (POST* "/:haku-id/hakemus/:hakemus-id/submit" [haku-id hakemus-id :as request]
       :path-params [haku-id :- Long, hakemus-id :- s/Str]
       :body    [answers (describe Answers "New answers")]
       :return  Hakemus
       :summary "Submit hakemus"
       (let [form-id (:form (va-db/get-avustushaku haku-id))
             validation (validation/validate-form (form-db/get-form form-id) answers)]
         (if (every? empty? (vals validation))
           (let [hakemus (va-db/get-hakemus hakemus-id)
                 submission-id (:form_submission_id hakemus)
                 saved-answers (update-form-submission form-id submission-id answers)
                 submitted-hakemus (va-db/submit-hakemus hakemus-id)]
             (hakemus-ok-response submitted-hakemus (:body saved-answers)))
           (bad-request! validation))))

  )

(defroutes* api-routes
  "API implementation"

  ;; Bind form routes

  (context* "/form" [] :tags ["forms"] form-routes)

  ;; Bind avustushaku routes
  (context* "/avustushaku" [] :tags ["avustushaut"] avustushaku-routes))


(defroutes* doc-routes
  "API documentation browser"
  (swagger-ui))

(defapi restricted-routes
  {:formats [:json-kw]}

  ;; swagger.json generation
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name "forms"
                         :description "Form and form submission management"}
                        {:name "avustushaut"
                         :description "Avustushaku"}]})

  (context* "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  (context "/doc" [] doc-routes)

  (GET "/" [](charset (content-type (resp/resource-response "index.html" {:root "public"}) "text/html") "utf-8"))
  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))

(defapi all-routes
  {:formats [:json-kw]}

  ;; swagger.json generation
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name "forms"
                         :description "Form and form submission management"}
                        {:name "avustushaut"
                         :description "Avustushaku"}]})

  (context* "/api/form" [] :tags ["forms"] form-routes)
  (context* "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  ;; Documentation
  (context "/doc" [] doc-routes)

  (GET "/" [](charset (content-type (resp/resource-response "index.html" {:root "public"}) "text/html") "utf-8"))
  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))
