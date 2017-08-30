(ns oph.va.hakija.hakija-server-spec
  (:use [clojure.tools.trace])
  (:require [clojure.string :as string]
            [speclj.core :refer :all]
            [org.httpkit.client :as http]
            [cheshire.core :refer :all]
            [clj-time.format :as f]
            [clj-time.local :as l]
            [oph.soresu.form.db :as form-db]
            [oph.va.budget :as va-budget]
            [oph.va.hakija.db :as va-db]
            [oph.soresu.form.formutil :as formutil]
            [oph.common.testing.spec-plumbing :refer :all]
            [oph.va.hakija.server :refer :all]))

(def test-server-port 9000)
(def base-url (str "http://localhost:" test-server-port ) )
(defn path->url [path] (str base-url path))
(defn get! [path] @(http/get (path->url path) {:as :text}))
(defn delete! [path] @(http/delete (path->url path)))
(defn put! [path body] @(http/put (path->url path) {:body (generate-string body true)
                                                    :headers {"Content-Type" "application/json"}}))
(defn post! [path body] @(http/post (path->url path) {:body (generate-string body true)
                                                      :headers {"Content-Type" "application/json"}}))
(defn json->map [body] (parse-string body true))

(defn find-by-id [json id] (first (filter (fn [e] (.equals ( :id e) id)) (-> (formutil/flatten-elements (json :content))))))

(defn update-answers
  ([answers key val & kvs]
   (if (-> kvs count even?)
     (let [key-vals  (->> kvs
                          (partition 2)
                          (map vec)
                          (apply vector [key val])
                          (into {}))
           update-fn (fn [answer]
                       (if-some [key (:key answer)]
                         (if (contains? key-vals key)
                           (assoc answer :value (get key-vals key))
                           answer)
                         answer))]
       (assoc answers :value (map update-fn (:value answers))))
     (throw (IllegalArgumentException.
             "update-answers expects even number of arguments after key-val, found odd number")))))

(defn conj-answers [answers answer]
  (update answers :value #(conj % answer)))

(def valid-answers
  {:value [{:key "organization" :value "Testi Organisaatio" :fieldType "textField"}
           {:key "organization-email" :value "org@example.com" :fieldType "emailField"}
           {:key "business-id" :value "5278603-3" :fieldType "finnishBusinessIdField"}
           {:key "applicant-name" :value "Teemu Hakija" :fieldType "textField"}
           {:key "primary-email" :value "test@example.com" :fieldType "emailField"}
           {:key "signature" :value "Teemu Testaaja, CEO" :fieldType "textField"}
           {:key "signature-email" :value "teemu@example.com" :fieldType "emailField"}
           {:key "language" :value "fi" :fieldType "radioButton"}
           {:key "project-name" :value "Server-spec-hanke" :fieldType "textField"}
           {:key "combined-effort" :value "no" :fieldType "radioButton"}
           {:key "other-organizations"
            :value [{:key "other-organizations-1"
                     :value [{:key "other-organizations.other-organizations-1.name" :value "E.T. Extra Terrestrial" :fieldType "textField"}
                             {:key "other-organizations.other-organizations-1.email" :value "et@example.com" :fieldType "emailField"}]
                     :fieldType "growingFieldsetChild"}]
            :fieldType "growingFieldset"}
           {:key "project-goals" :value "Maaleja" :fieldType "textField"}
           {:key "project-description.project-description-1.goal" :value "Paremmat oppimistulokset" :fieldType "textField"}
           {:key "project-description.project-description-1.activity" :value "Pidämme työpajoja" :fieldType "textField"}
           {:key "project-description.project-description-1.result" :value "Jotkut lähtevät jatko-opiskelemaan" :fieldType "textField"}
           {:key "bank-bic" :value "5000" :fieldType "bic"}
           {:key "bank-iban" :value "FI 32 5000 4699350600" :fieldType "iban"}
           {:key "project-target" :value "Maali" :fieldType "textField"}
           {:key "project-measure" :value "Mittaus" :fieldType "textField"}
           {:key "project-announce" :value "Julkaisut" :fieldType "textField"}
           {:key "project-effectiveness" :value "Tehokkuus" :fieldType "textField"}
           {:key "project-spreading-plan" :value "Jakelusuunnitelma" :fieldType "textField"}
           {:key "coordination-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "personnel-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "service-purchase-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "material-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "rent-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "equipment-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "steamship-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "other-costs-row.amount" :value "10" :fieldType "moneyField"}
           {:key "project-incomes-row.amount" :value "10" :fieldType "moneyField"}
           {:key "eu-programs-income-row.amount" :value "10" :fieldType "moneyField"}
           {:key "other-public-financing-income-row.amount" :value "10" :fieldType "moneyField"}
           {:key "private-financing-income-row.amount" :value "10" :fieldType "moneyField"}]})

(def negative-budget-answers
  (update-answers valid-answers
                  "coordination-costs-row.amount"            "10"
                  "personnel-costs-row.amount"               "0"
                  "service-purchase-costs-row.amount"        "0"
                  "material-costs-row.amount"                "0"
                  "rent-costs-row.amount"                    "0"
                  "equipment-costs-row.amount"               "0"
                  "steamship-costs-row.amount"               "0"
                  "other-costs-row.amount"                   "0"
                  "project-incomes-row.amount"               "10"
                  "eu-programs-income-row.amount"            "0"
                  "other-public-financing-income-row.amount" "0"
                  "private-financing-income-row.amount"      "0"))

(def most-required-missing
  {:project-begin                                        []
   :applicant-name                                       [{:error "required"}]
   :primary-email                                        []
   :signature                                            [{:error "required"}]
   :project-description.project-description-1.goal     [{:error "required"}]
   :project-description.project-description-1.activity [{:error "required"}]
   :project-description.project-description-1.result   [{:error "required"}]
   :continuation-project                                 []
   :bank-bic                                             [{:error "required"}]
   :organization                                         []
   :organization-email                                   [{:error "required"}]
   :business-id                                          [{:error "required"}]
   :project-effectiveness                                [{:error "required"}]
   :project-spreading-plan                               [{:error "required"}]
   :project-measure                                      [{:error "required"}]
   :project-name                                         [{:error "required"}]
   :combined-effort                                      [{:error "required"}]
   :language                                             [{:error "required"}]
   :project-www                                          []
   :signature-email                                      [{:error "required"}]
   :bank-iban                                            [{:error "required"}]
   :project-goals                                        [{:error "required"}]
   :project-target                                       [{:error "required"}]
   :other-partners                                       []
   :project-announce                                     [{:error "required"}]
   :project-end                                          []
   :vat-included                                         []
   :coordination-costs-row.description                   []
   :coordination-costs-row.amount                        [{:error "required"}]
   :personnel-costs-row.description                      []
   :personnel-costs-row.amount                           [{:error "required"}]
   :service-purchase-costs-row.description               []
   :service-purchase-costs-row.amount                    [{:error "required"}]
   :material-costs-row.description                       []
   :material-costs-row.amount                            [{:error "required"}]
   :rent-costs-row.description                           []
   :rent-costs-row.amount                                [{:error "required"}]
   :equipment-costs-row.description                      []
   :equipment-costs-row.amount                           [{:error "required"}]
   :steamship-costs-row.description                      []
   :steamship-costs-row.amount                           [{:error "required"}]
   :other-costs-row.description                          []
   :other-costs-row.amount                               [{:error "required"}]
   :project-incomes-row.description                      []
   :project-incomes-row.amount                           [{:error "required"}]
   :eu-programs-income-row.description []
   :eu-programs-income-row.amount [{:error "required"}]
   :other-public-financing-income-row.description []
   :other-public-financing-income-row.amount [{:error "required"}]
   :private-financing-income-row.description []
   :private-financing-income-row.amount [{:error "required"}]})

(defn- put-hakemus [answers]
  (let [{:keys [status headers body error] :as resp} (put! "/api/avustushaku/1/hakemus" answers)
        json (json->map body)
        id (:id json)
        version (:version json)]
    {:hakemus-id id :json json :version version :status status}))

(defmacro set-time [time-str & form]
  `(do
    (put! "/api/test/system-time" {:system-time ~time-str})
    (try ~@form
        (finally (delete! "/api/test/system-time")))))

(def hakemus-start-timestamp "2015-08-19T07:59:59.999+03")
(def hakemus-open-timestamp "2015-09-30T16:14:59.999+03")
(def hakemus-end-timestamp "2015-09-30T16:15:00.000+03")

(describe "HTTP server when haku is open"

  (tags :server :server-with-open-haku)

  ;; Start HTTP server for running tests
  (around-all [_]
    (with-test-server! :form-db #(start-server "localhost" test-server-port false) (_)))

  ;; Set time
  (around-all [_]
    (set-time hakemus-open-timestamp (_)))

  (it "GET should return valid form JSON from route /api/form/1"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1")
            json (json->map body)]
        (should= 200 status)
        (should= nil (-> json :id))
        (should= {:fieldClass "infoElement"
                  :id "name"
                  :fieldType "h1"} (-> json :content first))
        (should= {:fieldType "dateRange",
                  :id "duration",
                  :fieldClass "infoElement"} (-> json :content second))
        (should= {:fieldClass "formField"
                  :id "organization"
                  :required true
                  :fieldType "textField"
                  :params {:size "large"
                           :maxlength 80}
                  :label {:fi "Hakijaorganisaatio"
                          :sv "Sökandeorganisation"}
                  :helpText {:fi "Ilmoita hakijaorganisaation nimi ja virallinen sähköpostiosoite."
                             :sv "Meddela sökandeorganisationens namn och officiella e-postadress."}}
                 (find-by-id json "organization"))
        (should= {:fieldClass "infoElement"
                  :id "selection-criteria"
                  :fieldType "bulletList"
                  :params {:preview false :initiallyOpen true}} (find-by-id json "selection-criteria"))
        ))

  (it "GET should return not-found from route /api/form/1/values/1"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1/values/1")]
        (should= 404 status)))

  (it "PUT should validate required values when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" {:value [ {:key "organization" :value "Testi Organisaatio" :fieldType "textField" }
                                                                                              {:key "primary-email" :value "test@example.com" :fieldType "emailField" }
                                                                                              {:key "signature " :value "" :fieldType "textField" }
                                                                                             ] } )
            json (json->map body)]
        (should= 400 status)
        (should= most-required-missing json)))

  (it "PUT should validate text field lengths when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" (update-in valid-answers
                                                                                               [ :value ]
                                                                                               concat [ {:key "project-end"
                                                                                                         :value "10.10.10000"
                                                                                                         :fieldType "textField"}]))
            json (json->map body)]
        (should= 400 status)
        (should= (json :project-end) [{:error "maxlength", :info {:max 10}}])))

  (it "PUT should validate text field lengths and options when done to route /api/avustushaku/1/hakemus"
      (let [{:keys [status json] } (put-hakemus {:value [{:key "language" :value "ru" :fieldType "radioButton"}
                                                         {:key "project-end" :value "10.10.10000" :fieldType "textField"}  ]})]
        (should= 400 status)
        (should= (json :language) [{:error "invalid-option"}])
        (should= (json :project-end) [{:error "maxlength", :info {:max 10}}])))

  (it "PUT should create a new form submission and return id when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" valid-answers)
            json (json->map body)]
        (should= 200 status)
        (should= 1 (:id json))))

  (it "POST should validate required values when done to route /api/form/1/values/1"
      (let [{:keys [status headers body error] :as resp} (post! "/api/form/1/values/1" {:value [{:key "organization" :value "Testi Organisaatio" :fieldType "textField"}
                                                                                                {:key "primary-email" :value "test@example.com" :fieldType "emailField"}
                                                                                                ]})
          json (json->map body)]
      (should= 400 status)
      (should= most-required-missing json)))

  (it "POST should fail if done to non-existing node /api/form/1/values/2"
      (let [{:keys [status headers body error] :as resp} (post! "/api/form/1/values/2" valid-answers)]
        (should= 404 status)))

  (it "POST should create a new form submission version when done to route /api/form/1/values/1"
      (let [{:keys [status headers body error] :as resp} (post! "/api/form/1/values/1" valid-answers)
            json (json->map body)]
        (should= 200 status)
        (should= 1 (:version json))
        (let [{:keys [status headers body error] :as resp} (post! "/api/form/1/values/1" valid-answers)
              json (json->map body)]
          (should= 200 status)
          (should= 2 (:version json)))))

  (it "GET should always return latest form submission version for /api/form/1/values/1"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1/values/1")
            json (json->map body)]
        (should= 200 status)
        (should= 2 (:version json))))

  (it "PUT /api/avustushaku/1/hakemus/ should return hakemus status"
      (let [{:keys [status headers body error] :as resp} (put! "/api/avustushaku/1/hakemus"
                  {:value [{:key "language" :value "sv" :fieldType "radioButton"}
                           {:key "primary-email" :value "testi@test.te" :fieldType "emailField"}
                           {:key "signature-email" :value "signature@test.te" :fieldType "emailField"}
                           {:key "other-organizations.other-organizations-1.email" :value "other@test.te" :fieldType "emailField"}
                           {:key "organization-email" :value "organization@test.te" :fieldType "emailField"}]})
            json (json->map body)]
        (should= 200 status)
        (should= "new" (:status json))))

  (it "PUT /api/avustushaku/1/hakemus/ should return hakemus status should detect SMTP injection"
      (let [answers (update-answers valid-answers "primary-email" "misterburns@springfield.xxx%0ASubject:My%20Anonymous%20Subject")
            {:keys [status json]} (put-hakemus answers)]
        (should= 400 status)
        (should= [{:error "email"}] (:primary-email json))))

  (it "Email address validation should catch malformed email addresses"
      ;; Create submission
      (let [{:keys [status hakemus-id version]} (put-hakemus valid-answers)]
        (should= 200 status)

        ;; Run different malformed emails through the validation
        (doseq [email ["testi@test.t"
                       "notanemail"
                       "hello;select * "
                       (string/join (concat ["test@"] (repeat 85 ".test") [".tt"]))
                       "misterburns@springfield.xxx%0ASubject:My%20Anonymous%20Subject"]]
          (let [answers (update-answers valid-answers "primary-email" email)
                {:keys [status headers body error] :as resp} (post! (str "/api/avustushaku/1/hakemus/" hakemus-id "/" version "/submit") answers)
                json (json->map body)]
            (if (not (= [{:error "email"}] (:primary-email json)))
              (should-fail (str "Value " email " did not generate error, it should have"))))))
      )

  (it "After cancellation hakemus is not returned from /api/avustushaku/1/hakemus/1"
    ;; Create submission
    (let [{:keys [status hakemus-id ] } (put-hakemus valid-answers)]
      (should= 200 status)
      (should-not= "" hakemus-id)

      ;; Get before cancellation
      (let [{:keys [status headers body error] :as resp} (get! (str "/api/avustushaku/1/hakemus/" hakemus-id))
            json (json->map body)
            id (:id json)
            submission-version (:version (:submission json))
            submission-id (->> hakemus-id
                               (va-db/get-hakemus)
                               :form_submission_id)]
        (should= 200 status)
        (should= "draft" (:status json))
        (let [avustushaku (va-db/get-avustushaku 1)
              form (form-db/get-form (:form avustushaku))]
          (va-db/cancel-hakemus 1
                              id
                              submission-id
                              submission-version
                              nil
                              valid-answers
                              (va-budget/calculate-totals-hakija valid-answers
                                                                 avustushaku
                                                                 form)
                              "Peruttu hakijan pyynnöstä"))

        ;; Get after cancellation
        (let [{:keys [status headers body error] :as resp} (get! (str "/api/avustushaku/1/hakemus/" id))]
          (should= 404 status)))))

  (it "Stores budget totals to database on put (creation)"
      (let [{:keys [hakemus-id status]} (put-hakemus valid-answers)
            created-hakemus (va-db/get-hakemus hakemus-id)]
          (should= 200 status)
          (should= 40 (:budget_total created-hakemus))
          (should= 30 (:budget_oph_share created-hakemus))))

  (it "Stores budget totals to database on post (update)"
      (let [{:keys [hakemus-id version]} (put-hakemus valid-answers)
            updated-answers (update-answers valid-answers "material-costs-row.amount" "1000")
            {:keys [status]} (post! (str "/api/avustushaku/1/hakemus/" hakemus-id "/" version) updated-answers)
              posted-hakemus (va-db/get-hakemus hakemus-id)]
          (should= 200 status)
          (should= 1030 (:budget_total posted-hakemus))
          (should= 772 (:budget_oph_share posted-hakemus))))

  (it "Stores budget totals to database on submit"
      (let [{:keys [hakemus-id version]} (put-hakemus valid-answers)
            updated-answers (update-answers valid-answers "material-costs-row.amount" "2000")
            {:keys [status]} (post! (str "/api/avustushaku/1/hakemus/" hakemus-id "/" version "/submit") updated-answers)
            posted-hakemus (va-db/get-hakemus hakemus-id)]
          (should= 200 status)
          (should= 2030 (:budget_total posted-hakemus))
          (should= 1522 (:budget_oph_share posted-hakemus))))

  (it "Validates budget on put (creation)"
      (let [{:keys [status json]} (put-hakemus negative-budget-answers)
            validation-errors (:validation-errors json)]
        (should= 200 status)
        (should= [{:error "negative-budget"}] (:budget validation-errors))))

  (it "Validates budget on post (update)"
      (let [{:keys [hakemus-id version]} (put-hakemus valid-answers)
            {:keys [status body]} (post! (str "/api/avustushaku/1/hakemus/" hakemus-id "/" version) negative-budget-answers)
            validation-errors (:validation-errors (json->map body))]
        (should= 200 status)
        (should= [{:error "negative-budget"}] (:budget validation-errors))))

  (it "Validates budget on submit"
      (let [{:keys [hakemus-id version]} (put-hakemus valid-answers)
            {:keys [status body]} (post! (str "/api/avustushaku/1/hakemus/" hakemus-id "/" version "/submit") negative-budget-answers)
            validation-errors (json->map body)]
        (should= 400 status)
        (should= [{:error "negative-budget"}] (:budget validation-errors))))

  (it "Stores organization and project names to database on put (creation)"
      (let [{:keys [hakemus-id status]} (put-hakemus valid-answers)
            created-hakemus (va-db/get-hakemus hakemus-id)]
          (should= 200 status)
          (should= "Testi Organisaatio" (:organization_name created-hakemus))
          (should= "Server-spec-hanke" (:project_name created-hakemus))))

  (it "Stores organization and project names to database on post (update)"
      (let [{:keys [hakemus-id version]} (put-hakemus valid-answers)
            updated-answers (-> valid-answers
                                (update-answers "organization" "Uusi organisaatio")
                                (update-answers "project-name" "Uusi projekti"))
            {:keys [status]} (post! (str "/api/avustushaku/1/hakemus/" hakemus-id "/" version) updated-answers)
            posted-hakemus (va-db/get-hakemus hakemus-id)]
          (should= 200 status)
          (should= "Uusi organisaatio" (:organization_name posted-hakemus))
          (should= "Uusi projekti" (:project_name posted-hakemus))))

  (it "Stores organization and project names to database on submit"
      (let [{:keys [hakemus-id version]} (put-hakemus valid-answers)
            updated-answers (-> valid-answers
                                (update-answers "organization" "Yet another organisaatio")
                                (update-answers "project-name" "Uudempi projekti"))
            {:keys [status]} (post! (str "/api/avustushaku/1/hakemus/" hakemus-id "/" version "/submit") updated-answers)
              posted-hakemus (va-db/get-hakemus hakemus-id)]
          (should= 200 status)
          (should= "Yet another organisaatio" (:organization_name posted-hakemus))
          (should= "Uudempi projekti" (:project_name posted-hakemus))))
)

(describe "HTTP server when haku has ended"

  (tags :server)

  ;; Start HTTP server for running tests
  (around-all [_]
    (with-test-server! :form-db #(start-server "localhost" test-server-port false) (_)))

  ;; Set time
  (around-all [_]
    (set-time hakemus-end-timestamp (_)))

  (it "PUT /api/avustushaku/1/hakemus/ should fail"
    (let [{:keys [status headers body error] :as resp} (put! "/api/avustushaku/1/hakemus" valid-answers)
          json (json->map body)]
      (should= 405 status)
      (should= "ended" (:phase json))))

  (it "POST /api/avustushaku/1/hakemus/<id>/<baseversion> should fail"
    (let [{:keys [status headers body error] :as resp} (post! "/api/avustushaku/1/hakemus/hakemus-id/1" valid-answers)
          json (json->map body)]
      (should= 405 status)
      (should= "ended" (:phase json))))

  (it "POST /api/avustushaku/1/hakemus/<id>/<baseversion>/submit should fail"
      (let [{:keys [status headers body error] :as resp} (post! "/api/avustushaku/1/hakemus/hakemus-id/1/submit" valid-answers)
            json (json->map body)]
        (should= 405 status)
        (should= "ended" (:phase json))))
)

(describe "HTTP server before haku has started"

  (tags :server)

  ;; Start HTTP server for running tests
  (around-all [_]
    (with-test-server! :form-db #(start-server "localhost" test-server-port false) (_)))

  ;; Set time
  (around-all [_]
    (set-time hakemus-start-timestamp (_)))

  (it "PUT /api/avustushaku/1/hakemus/ should fail"
    (let [{:keys [status headers body error] :as resp} (put! "/api/avustushaku/1/hakemus" valid-answers)
          json (json->map body)]
      (should= 405 status)
      (should= "upcoming" (:phase json))))
)

(describe "HTTP server with haku requiring explicit self-financing amount"

  (tags :server)

  (around-all [_]
    (with-test-server! :form-db #(start-server "localhost" test-server-port false) (_)))

  (around-all [_]
    ;; Add self-financing-amount field to the budget in avustushaku form
    (letfn [(update-if-budget-summary-element [field]
              (if (= (:fieldType field) "vaBudgetSummaryElement")
                (assoc field :children [{:id         "self-financing-amount"
                                         :fieldClass "formField"
                                         :fieldType  "vaSelfFinancingField"
                                         :required   true}])
                field))

            (update-if-budget [field]
              (if (= (:fieldType field) "vaBudget")
                (update field :children (partial map update-if-budget-summary-element))
                field))

            (update-if-financing-plan [field]
              (if (= (:id field) "financing-plan")
                (update field :children (partial map update-if-budget))
                field))]
      (let [old-form (form-db/get-form 1)
            new-form (update old-form :content (partial map update-if-financing-plan))]
        (form-db/update-form! new-form)
        (_))))

  (around-all [_]
    (set-time hakemus-open-timestamp (_)))

  (it "Stores budget totals to database according to minimum self-financing percentage on put (creation) for hakemus without self-financing amount"
      (let [{:keys [hakemus-id status json]} (put-hakemus valid-answers)
            created-hakemus (va-db/get-hakemus hakemus-id)]
        (should= 200 status)
        (should= [{:error "required"}] (-> json :validation-errors :self-financing-amount))
        (should= 40 (:budget_total created-hakemus))
        (should= 30 (:budget_oph_share created-hakemus))))

  (it "Stores budget totals to database according to given self-financing amount on put (creation) for hakemus with self-financing amount"
      (let [{:keys [hakemus-id status json]} (put-hakemus (conj-answers valid-answers {:key "self-financing-amount" :value "26" :fieldType "moneyField"}))
            created-hakemus (va-db/get-hakemus hakemus-id)]
        (should= 200 status)
        (should-be empty? (-> json :validation-errors :self-financing-amount))
        (should= 40 (:budget_total created-hakemus))
        (should= 14 (:budget_oph_share created-hakemus))))

  (it "Stores budget totals to database on post (update) when changing self-financing amount"
      (let [{:keys [hakemus-id version]} (put-hakemus valid-answers)
            updated-answers (conj-answers valid-answers {:key "self-financing-amount"
                                                         :value "26"
                                                         :fieldType "moneyField"})
            {:keys [status]} (post! (str "/api/avustushaku/1/hakemus/" hakemus-id "/" version) updated-answers)
            posted-hakemus (va-db/get-hakemus hakemus-id)]
        (should= 200 status)
        (should= 40 (:budget_total posted-hakemus))
        (should= 14 (:budget_oph_share posted-hakemus))))

  (it "Stores budget totals to database on submit"
      (let [{:keys [hakemus-id version]} (put-hakemus valid-answers)
            updated-answers (conj-answers valid-answers {:key "self-financing-amount"
                                                         :value "26"
                                                         :fieldType "moneyField"})
            {:keys [status]} (post! (str "/api/avustushaku/1/hakemus/" hakemus-id "/" version "/submit") updated-answers)
            posted-hakemus (va-db/get-hakemus hakemus-id)]
        (should= 200 status)
        (should= 40 (:budget_total posted-hakemus))
        (should= 14 (:budget_oph_share posted-hakemus)))))

(describe "Tries to get data out of businessId API"

(around-all [_]
 (with-test-server! :form-db #(start-server "localhost" test-server-port false) (_)))

  (it "Tries to get organizational data with business id"
  (let [{:keys [status headers body error] :as resp} (get! "/businessid?id=12345-6")
        data (json->map body)]
    (should= 200 status)
    (should-contain :email (keys data))
    (should= #{:name :email :address :businessId} (set (keys data))))))

(run-specs)
