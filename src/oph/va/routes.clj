(ns ^{:skip-aot true} oph.va.routes
  (:use [clojure.tools.trace :only [trace]])
  (:require [compojure.route :as route]
            [clojure.tools.logging :as log]
            [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [compojure.core :refer [defroutes GET]]
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

(defn hakemus-conflict-response [hakemus]
  (conflict! {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
              :status (:status hakemus)
              :version (:version hakemus)
              :last_status_change_at (:last_status_change_at hakemus)}))

(defn hakemus-ok-response [hakemus submission]
  (ok {:id (if (:enabled? (:email config)) "" (:user_key hakemus))
       :status (:status hakemus)
       :version (:version hakemus)
       :last_status_change_at (:last_status_change_at hakemus)
       :submission submission}))

(defn- handle-hakemus-create [haku-id answers]
  (let [avustushaku (va-db/get-avustushaku haku-id)
        avustushaku-content (:content avustushaku)
        form-id (:form avustushaku)
        form (form-db/get-form form-id)
        validation (validation/validate-form-security form answers)]
    (if (every? empty? (vals validation))
      (if-let [new-hakemus (va-db/create-hakemus! form-id answers)]
        ;; TODO: extract
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
                                                  [email]
                                                  haku-id
                                                  avustushaku-title
                                                  user-key
                                                  avustushaku-start-date
                                                  avustushaku-end-date))
            (hakemus-ok-response (:hakemus new-hakemus) (:submission new-hakemus)))
        (internal-server-error!))
      (bad-request! validation))))

(defn- handle-hakemus-submit [haku-id hakemus-id base-version answers]
  (let [form-id (:form (va-db/get-avustushaku haku-id))
        validation (validation/validate-form (form-db/get-form form-id) answers)]
    (if (every? empty? (vals validation))
      (let [hakemus (va-db/get-hakemus hakemus-id)]
        (if (= base-version (:version hakemus))
          (let [submission-id (:form_submission_id hakemus)
                saved-submission (:body (update-form-submission form-id submission-id answers))
                submission-version (:version saved-submission)
                submitted-hakemus (va-db/submit-hakemus hakemus-id submission-id submission-version)
                ;; TODO: extract
                avustushaku (va-db/get-avustushaku haku-id)
                avustushaku-content (:content avustushaku)
                language (keyword (find-hakemus-value answers "language"))
                avustushaku-title (-> avustushaku-content :name language)
                avustushaku-duration (->> avustushaku-content
                                          :duration)
                avustushaku-start-date (->> avustushaku-duration
                                            :start
                                            (datetime/parse))
                avustushaku-end-date (->> avustushaku-duration
                                          :end
                                          (datetime/parse))
                organization-email (find-hakemus-value answers "organization-email")
                primary-email (find-hakemus-value answers "primary-email")
                signature-email (find-hakemus-value answers "signature-email")
                user-key (-> submitted-hakemus :user_key)]
            (va-email/send-hakemus-submitted-message! language
                                                      [primary-email organization-email signature-email]
                                                      haku-id
                                                      avustushaku-title
                                                      user-key
                                                      avustushaku-start-date
                                                      avustushaku-end-date)
            (hakemus-ok-response submitted-hakemus saved-submission))
          (hakemus-conflict-response hakemus)))
      (bad-request! validation))))

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
              submission (:body (get-form-submission form-id submission-id))
              submission-version (:version submission)]
          (if (= (:status hakemus) "new")
            (let [verified-hakemus (va-db/verify-hakemus hakemus-id submission-id submission-version)]
              (hakemus-ok-response verified-hakemus submission))
            (hakemus-ok-response hakemus submission))))

  (PUT* "/:haku-id/hakemus" [haku-id :as request]
      :path-params [haku-id :- Long]
      :body    [answers (describe Answers "New answers")]
      :return  Hakemus
      :summary "Create initial hakemus"
      (handle-hakemus-create haku-id answers))

  (POST* "/:haku-id/hakemus/:hakemus-id/:base-version" [haku-id hakemus-id base-version :as request]
       :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
       :body    [answers (describe Answers "New answers")]
       :return  Hakemus
       :summary "Update hakemus values"
       (let [form-id (:form (va-db/get-avustushaku haku-id))
             validation (validation/validate-form-security (form-db/get-form form-id) answers)]
         (if (every? empty? (vals validation))
           (let [hakemus (va-db/get-hakemus hakemus-id)]
             (if (= base-version (:version hakemus))
               (let [updated-submission (:body (update-form-submission form-id (:form_submission_id hakemus) answers))
                     updated-hakemus (va-db/update-submission hakemus-id (:form_submission_id hakemus) (:version updated-submission))]
                 (hakemus-ok-response updated-hakemus updated-submission))
               (hakemus-conflict-response hakemus)))
           (bad-request! validation))))

  (POST* "/:haku-id/hakemus/:hakemus-id/:base-version/submit" [haku-id hakemus-id base-version :as request]
       :path-params [haku-id :- Long, hakemus-id :- s/Str, base-version :- Long]
       :body    [answers (describe Answers "New answers")]
       :return  Hakemus
       :summary "Submit hakemus"
       (handle-hakemus-submit haku-id hakemus-id base-version answers)))

(defn return-html [filename]
  (-> (resp/resource-response filename {:root "public"})
      (content-type "text/html")
      (charset  "utf-8")))

(defroutes resource-routes
  (GET "/" []
       (resp/redirect "/avustushaku/1/"))

  ;; Finnish subcontext
  (GET "/avustushaku/:avustushaku-id/nayta" [avustushaku-id] (return-html "index.html"))
  (GET "/avustushaku/:avustushaku-id/" [avustushaku-id] (return-html "login.html"))
  (route/resources "/avustushaku/:avustushaku-id/" {:mime-types {"html" "text/html; charset=utf-8"}})

  ;; Swedish subcontext
  (GET "/statsunderstod/:avustushaku-id/visa" [avustushaku-id] (return-html "index.html"))
  (GET "/statsunderstod/:avustushaku-id/" [avustushaku-id] (return-html "login.html"))
  (route/resources "/statsunderstod/:avustushaku-id/" {:mime-types {"html" "text/html; charset=utf-8"}})

  (route/resources "/" {:mime-types {"html" "text/html; charset=utf-8"}})
  (route/not-found "<p>Page not found.</p>"))

(defroutes* doc-routes
  "API documentation browser"
  (swagger-ui))

(defn- exception-handler [^Exception e]
  (log/error e e)
  (internal-server-error {:type "unknown-exception"
                          :class (.getName (.getClass e))}))

(defapi restricted-routes
  {:formats [:json-kw]
   :exceptions {:exception-handler exception-handler}}

  ;; swagger.json generation
  (swagger-docs {:info {:title "Valtionavustus API"}
                 :tags [{:name "forms"
                         :description "Form and form submission management"}
                        {:name "avustushaut"
                         :description "Avustushaku"}]})

  (context* "/api/form" [] :tags ["forms"] form-restricted-routes)
  (context* "/api/avustushaku" [] :tags ["avustushaut"] avustushaku-routes)

  (context "/doc" [] doc-routes)

  ;; Resources
  resource-routes)

(defapi all-routes
  {:formats [:json-kw]
   :exceptions {:exception-handler exception-handler}}

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

  ;; Resources
  resource-routes)
