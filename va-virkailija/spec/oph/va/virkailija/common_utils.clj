(ns oph.va.virkailija.common-utils
  (:use [clojure.tools.trace])
  (:require [speclj.core :refer [should should= describe it tags around-all]]
            [cheshire.core :refer :all]
            [oph.soresu.form.db :as form-db]
            [oph.soresu.common.db :refer [exec]]
            [org.httpkit.client :as http]
            [oph.common.testing.spec-plumbing :refer [with-test-server!]]
            [oph.va.virkailija.server :refer [start-server]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.virkailija.authentication :as auth]
            [oph.va.virkailija.db :as virkailija-db]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.hakija-api-tools :as hakija-api-tools]))

(def test-server-port 9001)
(def base-url (str "http://localhost:" test-server-port))

(defn path->url [path] (str base-url path))

(defn get! [path] @(http/get (path->url path) {:as :text}))

(defn put! [path body] @(http/put (path->url path) {:body (generate-string body true)
                                                    :headers {"Content-Type" "application/json"}}))
(defn post! [path body] @(http/post (path->url path) {:body (generate-string body true)
                                                      :headers {"Content-Type" "application/json"}}))
(defn delete! [path] @(http/delete (path->url path) {:as :text}))

(defn json->map [body] (parse-string body true))

(def valid-payment-values
  {:state 1
   :batch-id nil
   :payment-sum 50000})

(def user-authentication
  {:cas-ticket nil
   :timeout-at-ms (+ 100000000 (System/currentTimeMillis))
   :identity {:person-oid "1.2.111.111.11.11111111111",
              :first-name "Kalle",
              :surname "Käyttäjä",
              :email nil,
              :lang "fi",
              :privileges '("va-user"),
              :username "kayttaja"}})

(def admin-authentication
  {:cas-ticket nil
   :timeout-at-ms (+ 100000000 (System/currentTimeMillis))
   :identity {:person-oid "1.1.111.111.11.11111111111",
              :first-name "Tero",
              :surname "Testaaja",
              :email nil,
              :lang "fi",
              :privileges '("va-admin" "va-user"),
              :username "testaaja"}})

(defn add-mock-authentication [authentication]
  (auth/add-authentication authentication))

(defn remove-mock-authentication [authentication]
  (auth/remove-authentication authentication))

(defn create-submission [form-id answers]
  (form-db/create-submission! form-id answers))

(defn- generate-hash-id []
  "Function for generating test id"
  (java.util.UUID/randomUUID))

(defn create-application [grant submission]
  (first (exec :form-db hakija-api-tools/create-hakemus
               {:avustushaku_id (:id grant)
                :status :submitted
                :user_key (generate-hash-id)
                :form_submission_id (:id submission)
                :form_submission_version (:version submission)
                :version (:version submission)
                :budget_total 200000
                :budget_oph_share 1500000
                :organization_name "Test Organisation"
                :project_name "Test Project"
                :language "fi"
                :register_number "123/456/78"
                :hakemus_type "hakemus"})))

(defn create-application-evaluation [application status]
   (virkailija-db/update-or-create-hakemus-arvio
       (hakija-api/get-avustushaku (:avustushaku application))
       (:id application)
       {:status status
        :overridden-answers {}
        :roles {:evaluators []}
        :perustelut nil
        :acedemy-size 0
        :costsGranted 30000
        :budget-granted 30000
        :oppilaitokset []
        :presenter-role-id nil
        :presentercomment nil
        :rahoitusalue nil
        :seuranta-answers {}
        :should-pay true
        :should-pay-comments nil
        :summary-comment nil
        :tags {:value []}
        :talousarviotili nil}
       (:identity user-authentication)))

(defn create-evaluation [grant status]
   (create-application-evaluation
     (create-application
       grant
       (create-submission
         (:form grant) {:budget-oph-share 40000}))
     status))
