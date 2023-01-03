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
            [oph.va.virkailija.hakija-api-tools :as hakija-api-tools]
            [oph.va.virkailija.payments-data :as payments-data]))

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
  {:paymentstatus-id "waiting"
   :batch-id nil
   :payment-sum 50000
   :phase 0})

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
  (let [project (first (exec hakija-api-tools/create-project {}))]
    (first (exec hakija-api-tools/create-hakemus
                 {:avustushaku_id (:id grant)
                  :status :submitted
                  :user_key (generate-hash-id)
                  :form_submission_id (:id submission)
                  :form_submission_version (:version submission)
                  :version (:version submission)
                  :budget_total 200000
                  :project_id (:id project)
                  :budget_oph_share 1500000
                  :organization_name "Test Organisation"
                  :project_name "Test Project"
                  :language "fi"
                  :register_number "123/456/78"
                  :hakemus_type "hakemus"}))))

(defn create-valiselvitys [hakemus submission]
  (let [project (first (exec hakija-api-tools/create-project {}))]
    (first (exec hakija-api-tools/create-hakemus
                 {:avustushaku_id (:avustushaku hakemus)
                  :status :submitted
                  :user_key (generate-hash-id)
                  :form_submission_id (:id submission)
                  :form_submission_version (:version submission)
                  :version (:version submission)
                  :budget_total 200000
                  :budget_oph_share 1500000
                  :organization_name "Test Organisation"
                  :project_name "Test Project"
                  :project_id (:id project)
                  :language "fi"
                  :register_number "123/456/78"
                  :hakemus_type "valiselvitys"}))))


(defn create-application-evaluation
  ([application status values]
   (virkailija-db/update-or-create-hakemus-arvio
     (hakija-api/get-avustushaku (:avustushaku application))
     (:id application)
     (merge
       {:status status
        :overridden-answers {:value []}
        :roles {:evaluators []}
        :perustelut nil
        :academysize 0
        :useDetailedCosts false
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
        :talousarviotili "29103013"}
       values)
     (:identity user-authentication)))
  ([application status]
   (create-application-evaluation application status {})))

(defn create-evaluation
  ([grant status values]
    (create-application-evaluation
      (create-application
        grant
        (create-submission
          (:form grant) {:budget-oph-share 40000}))
      status
      values))
  ([grant status]
    (create-evaluation grant status {})))

(defn create-payment [grant batch phase sum]
  (let [submission
        (create-submission
          (:form grant)
          {:value
           [{:key "business-id" :value "1234567-1" :fieldType "textArea"}
            {:key "bank-iban" :value "FI4250001510000023" :fieldType "textArea"}
            {:key "bank-bic" :value "OKOYFIHH" :fieldType "textArea"}
            {:key "bank-country" :value "FI" :fieldType "textArea"}
            {:key "address" :value "Someroad 1" :fieldType "textArea"}
            {:key "city" :value "Some City" :fieldType "textArea"}
            {:key "country" :value "Some Country" :fieldType "textArea"}
            {:key "ownership-type" :value "liiketalous" :fieldType "textArea"}]})
        application (create-application grant submission)
        evaluation (create-application-evaluation application "accepted")]
    (payments-data/create-payment
      {:application-id (:id application)
       :payment-sum sum
       :batch-id (:id batch)
       :paymentstatus-id "waiting"
       :phase phase}
      {:person-oid "12345"
       :first-name "Test"
       :surname "User"})))
