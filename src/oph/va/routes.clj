(ns oph.va.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [compojure.route :as route]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [GET]]
            [compojure.api.sweet :refer :all]
            [schema.core :as s]
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

(defn- find-value-by-key [answers key]
  (->> answers
       :value
       (filter (partial matches-key? key))
       first
       :value))

(defn hakemus-ok-response [hakemus submission]
  (ok {:id (:user_key hakemus)
  :status (:status hakemus)
  :created_at (:created_at hakemus)
  :verified_at (:verified_at hakemus)
  :submission submission
  }))

(defroutes* verification-routes
  "Verification routes"
  (GET* "/:haku-id/:hakemus-id/:verification" [haku-id hakemus-id verification :as request]
        :path-params [haku-id :- Long, hakemus-id :- s/Str, verification :- s/Str]
       (let [hakemus (va-db/get-hakemus hakemus-id)
             form-id (:form (va-db/get-avustushaku haku-id))]
         (if (and (:verified_at hakemus) (= (:verify_key hakemus) verification))
           (resp/redirect "/")
           (let [verified-hakemus (va-db/verify-hakemus hakemus-id verification)]
             (if verified-hakemus
               (resp/resource-response "public/activated.html")
               (bad-request! verification)))))))

(defroutes* avustushaku-routes
  "Avustushaku routes"

  (GET* "/:id" [id]
        :path-params [id :- Long]
        :return AvustusHaku
        (let [avustushaku (va-db/get-avustushaku id)]
          (if avustushaku
            (ok avustushaku)
            (not-found))))

  (GET* "/:haku-id/hakemus/:hakemus-id" [haku-id hakemus-id]
        :path-params [haku-id :- Long, hakemus-id :- s/Str]
        :return  Hakemus
        :summary "Get current answers"
        (let [form-id (:form (va-db/get-avustushaku haku-id))
              hakemus (va-db/get-hakemus hakemus-id)
              submission (get-form-submission form-id (:form_submission_id hakemus))]
          (hakemus-ok-response hakemus (:body submission))))

  (PUT* "/:haku-id/hakemus" [haku-id :as request]
      :path-params [haku-id :- Long]
      :body    [answers (describe Answers "New answers")]
      :return  Hakemus
      :summary "Create initial hakemus"
      (let [form-id (:form (va-db/get-avustushaku haku-id))
            validation (validation/validate-form-security (form-db/get-form form-id) answers)]
        (if (every? empty? (vals validation))
          (let [newHakemus (va-db/create-hakemus! form-id answers)]
            (if newHakemus
              (do
                (let [language (keyword (find-value-by-key answers "language"))
                      email (find-value-by-key answers "primary-email")]
                  (va-email/send-activation-message! language email))
                (hakemus-ok-response (:hakemus newHakemus) (:submission newHakemus)))
            (internal-server-error!)))
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
                 saved-answers (update-form-submission form-id (:form_submission_id hakemus) answers)
                 submitted-hakemus (va-db/submit-hakemus hakemus-id)]
             (hakemus-ok-response submitted-hakemus (:body saved-answers)))
           (bad-request! validation))))

  )

(defroutes* api-routes
  "API implementation"

  (context* "/verification" [] :tags ["verification"] verification-routes)

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
                         :description "Avustushaku"}
                        {:name "verification"
                         :description "Hakemus verification"}]})

  ;; Route all requests with API prefix to API routes
  (context "/api" [] api-routes)

  ;; Documentation
  (context "/doc" [] doc-routes)

  (GET "/" [](charset (content-type (resp/resource-response "index.html" {:root "public"}) "text/html") "utf-8"))
  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))
