(ns oph.va.hakija.hakija-server-spec
  (:use [clojure.tools.trace])
  (:require [clojure.string :as string]
            [speclj.core :refer :all]
            [org.httpkit.client :as http]
            [cheshire.core :refer :all]
            [clj-time.format :as f]
            [clj-time.local :as l]
            [oph.va.hakija.db :as va-db]
            [oph.form.formutil :as formutil]
            [oph.common.testing.spec-plumbing :refer :all]
            [oph.va.hakija.server :refer :all]))

(def test-server-port 9000)
(def base-url (str "http://localhost:" test-server-port ) )
(defn path->url [path] (str base-url path))
(defn get! [path] @(http/get (path->url path) {:as :text}))
(defn put! [path body] @(http/put (path->url path) {:body (generate-string body true)
                                                    :headers {"Content-Type" "application/json"}}))
(defn post! [path body] @(http/post (path->url path) {:body (generate-string body true)
                                                      :headers {"Content-Type" "application/json"}}))
(defn json->map [body] (parse-string body true))

(defn find-by-id [json id] (first (filter (fn [e] (.equals ( :id e) id)) (-> (formutil/flatten-elements (json :content))))))

(defn update-answers [answers key value]
  (let [update-fn (fn [key new-value] (fn [value]
                                        (if (= (:key value) key)
                                          {:key key :value new-value}
                                          value)))]
    {:value (map (update-fn key value) (:value answers))}))

(def valid-answers
  {:value [{:key "organization" :value "Testi Organisaatio"}
           {:key "organization-email" :value "org@example.com"}
           {:key "business-id" :value "5278603-3"}
           {:key "applicant-name" :value "Teemu Hakija"}
           {:key "primary-email" :value "test@example.com"}
           {:key "signature" :value "Teemu Testaaja, CEO"}
           {:key "signature-email" :value "teemu@example.com"}
           {:key "language" :value "fi"}
           {:key "project-name" :value "Server-spec-hanke"}
           {:key "combined-effort" :value "no"}
           {:key "other-organizations"
            :value [{:key   "other-organizations-1"
                     :value [{:key "other-organizations.other-organizations-1.name" :value "E.T. Extra Terrestrial"}
                             {:key "other-organizations.other-organizations-1.email" :value "et@example.com"}]}]}
           {:key "project-goals" :value "Maaleja"}
           {:key "project-description.project-description-1.goal" :value "Paremmat oppimistulokset"}
           {:key "project-description.project-description-1.activity" :value "Pidämme työpajoja"}
           {:key "project-description.project-description-1.result" :value "Jotkut lähtevät jatko-opiskelemaan"}
           {:key "bank-bic" :value "5000"}
           {:key "bank-iban" :value "FI 32 5000 4699350600"}
           {:key "project-target" :value "Maali"}
           {:key "project-measure" :value "Mittaus"}
           {:key "project-announce" :value "Julkaisut"}
           {:key "project-effectiveness" :value "Tehokkuus"}
           {:key "project-spreading-plan" :value "Jakelusuunnitelma"}
           {:key "coordination-costs-row.amount" :value "10"}
           {:key "personnel-costs-row.amount" :value "10"}
           {:key "service-purchase-costs-row.amount" :value "10"}
           {:key "material-costs-row.amount" :value "10"}
           {:key "rent-costs-row.amount" :value "10"}
           {:key "equipment-costs-row.amount" :value "10"}
           {:key "steamship-costs-row.amount" :value "10"}
           {:key "other-costs-row.amount" :value "10"}
           {:key "project-incomes-row.amount" :value "10"}
           {:key "eu-programs-income-row.amount" :value "10"}
           {:key "other-public-financing-income-row.amount" :value "10"}
           {:key "private-financing-income-row.amount" :value "10"}]})

(def most-required-missing
  {:other-organizations.other-organizations-1.email      [{:error "required"} {:error "email"}]
   :project-begin                                        []
   :other-organizations.other-organizations-1.name       [{:error "required"}]
   :applicant-name                                       [{:error "required"}]
   :primary-email                                        []
   :signature                                            [{:error "required"}]
   :project-description.project-description-1.goal     [{:error "required"}]
   :project-description.project-description-1.activity [{:error "required"}]
   :project-description.project-description-1.result   [{:error "required"}]
   :continuation-project                                 []
   :bank-bic                                             [{:error "required"}]
   :organization                                         []
   :organization-email                                   [{:error "required"} {:error "email"}]
   :business-id                                          [{:error "required"} {:error "finnishBusinessId"}]
   :project-effectiveness                                [{:error "required"}]
   :project-spreading-plan                               [{:error "required"}]
   :project-measure                                      [{:error "required"}]
   :project-name                                         [{:error "required"}]
   :combined-effort                                      [{:error "required"}]
   :language                                             [{:error "required"}]
   :project-www                                          []
   :signature-email                                      [{:error "required"} {:error "email"}]
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

(describe "HTTP server"

  (tags :server)

  ;; Start HTTP server for running tests
  (around-all [_] (with-test-server! :db #(start-server "localhost" test-server-port false) (_)))

  (it "GET should return valid form JSON from route /api/form/1"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1")
            json (json->map body)]
        (should= 200 status)
        (should= 1 (-> json :id))
        (should= {:type "infoElement"
                  :id "name"
                  :displayAs "h1"} (-> json :content first))
        (should= {:displayAs "dateRange",
                  :id "duration",
                  :type "infoElement"} (-> json :content second))
        (should= {:type "formField"
                  :id "organization"
                  :required true
                  :displayAs "textField"
                  :params {:size "large"
                           :maxlength 80}
                  :label {:fi "Hakijaorganisaatio"
                          :sv "Sökandeorganisation"}
                  :helpText {:fi "Ilmoita hakijaorganisaation nimi ja virallinen sähköpostiosoite."
                             :sv "Meddela sökandeorganisationens namn och officiella e-postadress."}}
                 (find-by-id json "organization"))
        (should= {:type "infoElement"
                  :id "selection-criteria"
                  :displayAs "bulletList"
                  :params {:preview false :initiallyOpen true}} (find-by-id json "selection-criteria"))
        ))

  (it "GET should return not-found from route /api/form/1/values/1"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1/values/1")]
        (should= 404 status)))

  (it "PUT should validate required values when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" {:value [ {:key "organization" :value "Testi Organisaatio" }
                                                                                              {:key "primary-email" :value "test@example.com" }
                                                                                              {:key "signature " :value "" }
                                                                                             ] } )
            json (json->map body)]
        (should= 400 status)
        (should= most-required-missing json)))

  (it "PUT should validate text field lengths when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" (update-in valid-answers [ :value ] concat [ {:key "project-end" :value "10.10.10000"} ]))
            json (json->map body)]
        (should= 400 status)
        (should= (json :project-end) [{:error "maxlength", :max 10}])))

  (it "PUT should validate text field lengths and options when done to route /api/avustushaku/1/hakemus"
      (let [{:keys [status json] } (put-hakemus {:value [{:key "language" :value "ru"}
                                                         {:key "project-end" :value "10.10.10000"}  ]})]
        (should= 400 status)
        (should= (json :language) [{:error "invalid-option"}])
        (should= (json :project-end) [{:error "maxlength", :max 10}])))

  (it "PUT should create a new form submission and return id when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" valid-answers)
            json (json->map body)]
        (should= 200 status)
        (should= 1 (:id json))))

  (it "POST should validate required values when done to route /api/form/1/values/1"
      (let [{:keys [status headers body error] :as resp} (post! "/api/form/1/values/1" {:value [{:key "organization" :value "Testi Organisaatio"}
                                                                                                {:key "primary-email" :value "test@example.com"}
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
                  {:value [{:key "language" :value "sv"}
                           {:key "primary-email" :value "testi@test.te"}
                           {:key "signature-email" :value "signature@test.te"}
                           {:key "other-organizations.other-organizations-1.email" :value "other@test.te"}
                           {:key "organization-email" :value "organization@test.te"}]})
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
            submission-id (:id (:submission json))]
        (should= 200 status)
        (should= "draft" (:status json))
        (va-db/cancel-hakemus 1 id submission-id submission-version valid-answers)

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
          (should= 1522 (:budget_oph_share posted-hakemus)))))

(run-specs)
