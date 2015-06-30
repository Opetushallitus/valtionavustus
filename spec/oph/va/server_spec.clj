(ns oph.va.server-spec
  (:use [clojure.tools.trace])
  (:require [speclj.core :refer :all]
            [org.httpkit.client :as http]
            [cheshire.core :refer :all]
            [oph.form.validation :as validation]
            [oph.va.spec-plumbing :refer :all]))

(def base-url "http://localhost:9000")
(defn path->url [path] (str base-url path))
(defn get! [path] @(http/get (path->url path)))
(defn put! [path body] @(http/put (path->url path) {:body (generate-string body true)
                                                    :headers {"Content-Type" "application/json"}}))
(defn post! [path body] @(http/post (path->url path) {:body (generate-string body true)
                                                      :headers {"Content-Type" "application/json"}}))
(defn json->map [body] (parse-string body true))

(defn find-by-id [json id] (first (filter (fn [e] (.equals ( :id e) id)) (-> (validation/flatten-elements (json :content))))))

(def valid-answers
  {:organization "Testi Organisaatio"
   :primary-email "test@example.com"
   :signature "Teemu Testaaja, CEO"
   :signature-email "teemu@example.com"
   :language "fi"
   :combined-effort "no"
   :name "E.T. Extra Terrestrial"
   :email "et@example"
   :project-goals "Maaleja"
   :project-explanation "Selitys"
   :bank-bic "5000"
   :bank-iban "FI 32 5000 4699350600"
   :project-target "Maali"
   :project-measure "Mittaus"
   :project-announce "Julkaisut"
   :project-effectiveness "Tehokkuus"
   :project-spreading-plan "Jakelusuunnitelma"})

(describe "HTTP server"

  (tags :server)

  ;; Start HTTP server for running tests
  (around-all [_] (with-test-server! (_)))

  (it "GET should return valid form JSON from route /api/form/1"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1")
            json (json->map body)]
        (should= 200 status)
        (should= 1 (-> json :id))
        (should= {:type "infoElement"
                  :id "name"
                  :displayAs "h1"} (-> json :content first))
        (should= {:type "infoElement"
                  :id "duration"
                  :displayAs "endOfDateRange"
                  :label {:fi "Hakuaika päättyy"
                          :sv "Sista ansöknings"}} (-> json :content second))
        (should= {:type "formField"
                  :id "organization"
                  :required true
                  :displayAs "textField"
                  :params {:size 50
                           :maxlength 80}
                  :label {:fi "Hakijaorganisaatio"
                          :sv "Organisation"}} (find-by-id json "organization"))
        (should= {:type "infoElement"
                  :id "selection-criteria"
                  :displayAs "bulletList"
                  :params {:initiallyOpen true}} (find-by-id json "selection-criteria"))
        ))

  (it "GET should return not-found from route /api/form/1/values/1"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1/values/1")]
        (should= 404 status)))

  (it "PUT should validate required values when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" {:organization "Testi Organisaatio"
                                                                                     :primary-email "test@example.com"
                                                                                     :signature ""})
            json (json->map body)]
        (should= 400 status)
        (should= {:email [{:error "required"}]
                  :project-begin []
                  :name [{:error "required"}]
                  :primary-email []
                  :signature [{:error "required"}]
                  :project-explanation [{:error "required"}]
                  :continuation-project []
                  :bank-bic [{:error "required"}]
                  :organization []
                  :project-effectiveness [{:error "required"}]
                  :project-spreading-plan [{:error "required"}]
                  :project-measure [{:error "required"}]
                  :combined-effort [{:error "required"}]
                  :language [{:error "required"}]
                  :project-www []
                  :signature-email [{:error "required"}]
                  :bank-iban [{:error "required"}]
                  :project-goals [{:error "required"}]
                  :project-target [{:error "required"}]
                  :other-funding []
                  :other-partners []
                  :project-announce [{:error "required"}]
                  :project-end []}
                 json)))

  (it "PUT should validate text field lengths when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" (assoc valid-answers :project-end "10.10.10000"))
            json (json->map body)]
        (should= 400 status)
        (should= {:email []
                  :project-begin []
                  :name []
                  :primary-email []
                  :signature []
                  :project-explanation []
                  :continuation-project []
                  :bank-bic []
                  :organization []
                  :project-effectiveness []
                  :project-spreading-plan []
                  :project-measure []
                  :combined-effort []
                  :language []
                  :project-www []
                  :signature-email []
                  :bank-iban []
                  :project-goals []
                  :project-target []
                  :other-funding []
                  :other-partners []
                  :project-announce []
                  :project-end [{:error "maxlength" :max 10}]}
                 json)))

  (it "PUT should validate text field lengths and options when done to route /api/avustushaku/1/hakemus"
      (let [{:keys [status headers body error] :as resp} (put! "/api/avustushaku/1/hakemus"  {:language "ru"
                                                                                              :project-end "10.10.10000"})
            json (json->map body)]
        (should= 400 status)
        (should= {:email []
                  :project-begin []
                  :name []
                  :primary-email []
                  :signature []
                  :project-explanation []
                  :continuation-project []
                  :bank-bic []
                  :organization []
                  :project-effectiveness []
                  :project-spreading-plan []
                  :project-measure []
                  :combined-effort []
                  :language [{:error "invalid-option"}]
                  :project-www []
                  :signature-email []
                  :bank-iban []
                  :project-goals []
                  :project-target []
                  :other-funding []
                  :other-partners []
                  :project-announce []
                  :project-end [{:error "maxlength" :max 10}]}
                 json)))

  (it "PUT should create a new form submission and return id when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" valid-answers)
            json (json->map body)]
        (should= 200 status)
        (should= 1 (:id json))))

  (it "POST should validate required values when done to route /api/form/1/values/1"
    (let [{:keys [status headers body error] :as resp} (post! "/api/form/1/values/1" {:organization "Testi Organisaatio"
                                                                                      :primary-email "test@example.com"})
          json (json->map body)]
      (should= 400 status)
      (should= {:email [{:error "required"}]
                :project-begin []
                :name [{:error "required"}]
                :primary-email []
                :signature [{:error "required"}]
                :project-explanation [{:error "required"}]
                :continuation-project []
                :bank-bic [{:error "required"}]
                :organization []
                :project-effectiveness [{:error "required"}]
                :project-spreading-plan [{:error "required"}]
                :project-measure [{:error "required"}]
                :combined-effort [{:error "required"}]
                :language [{:error "required"}]
                :project-www []
                :signature-email [{:error "required"}]
                :bank-iban [{:error "required"}]
                :project-goals [{:error "required"}]
                :project-target [{:error "required"}]
                :other-funding []
                :other-partners []
                :project-announce [{:error "required"}]
                :project-end []}
               json)))

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
        (should= 2 (:version json)))))

(run-specs)
