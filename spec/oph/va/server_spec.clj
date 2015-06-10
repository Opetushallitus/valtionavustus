(ns oph.va.server-spec
  (:use [clojure.tools.trace])
  (:require [speclj.core :refer :all]
            [org.httpkit.client :as http]
            [cheshire.core :refer :all]
            [oph.va.spec-plumbing :refer :all]))

(def base-url "http://localhost:9000")
(defn path->url [path] (str base-url path))
(defn get! [path] @(http/get (path->url path)))
(defn put! [path body] @(http/put (path->url path) {:body (generate-string body true)
                                                    :headers {"Content-Type" "application/json"}}))
(defn post! [path body] @(http/post (path->url path) {:body (generate-string body true)
                                                      :headers {"Content-Type" "application/json"}}))
(defn json->map [body] (parse-string body true))

(describe "HTTP server"

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
                  :displayAs "dateRange"} (-> json :content second))
        (should= {:type "formField"
                  :id "organization"
                  :required true
                  :displayAs "textField"
                  :params {:size 50
                           :maxlength 80}
                  :label {:fi "Hakijaorganisaatio"
                          :sv "Organisation"}} (nth (-> json :content) 2 ))
        (should= {:type "infoElement"
                  :id "selection-criteria"
                  :displayAs "bulletList"
                  :label {:fi "Valintaperusteet"
                          :sv "Urvalskriterier"}
                  :params {:initiallyOpen true}} (nth (-> json :content) 11 ))
        ))

  (it "GET should return valid empty form values from route /api/form/1/values/1"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1/values/1")
            json (json->map body)]
        (should= 200 status)
        (should= true (empty? json))))

  (it "PUT should validate required values when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" {:organization "Testi Organisaatio"
                                                                                     :primary-email "test@example.com"
                                                                                     :signature ""})
            json (json->map body)]
        (should= 400 status)
        (should= {:other-organization-1-email [{:error "required"}],
                  :project-network [{:error "required"}],
                  :other-organization-1 [{:error "required"}],
                  :primary-email [], :signature [{:error "required"}],
                  :project-explanation [{:error "required"}],
                  :continuation-project [],
                  :organization [],
                  :project-measure [{:error "required"}],
                  :combined-effort [{:error "required"}],
                  :language [{:error "required"}],
                  :project-www [],
                  :signature-email [{:error "required"}],
                  :project-goals [{:error "required"}],
                  :project-target [{:error "required"}],
                  :project-announce [{:error "required"}],
                  :project-end []}
                 json)))

  (it "PUT should validate text field lengths and options when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" {:organization "Testi Organisaatio"
                                                                                     :primary-email "test@example.com"
                                                                                     :signature "Teemu Testaaja, CEO"
                                                                                     :signature-email "teemu@example.com"
                                                                                     :language "fi"
                                                                                     :combined-effort "no"
                                                                                     :other-organization-1 "E.T. Extra Terrestrial"
                                                                                     :other-organization-1-email "et@example"
                                                                                     :project-network "Verkko"
                                                                                     :project-goals "Maaleja"
                                                                                     :project-explanation "Selitys"
                                                                                     :project-target "Maali"
                                                                                     :project-measure "Mittaus"
                                                                                     :project-announce "Julkaisut"
                                                                                     :project-end "10.10.10000"})
            json (json->map body)]
        (should= 400 status)
        (should= {:other-organization-1-email [],
                  :project-network [],
                  :other-organization-1 [],
                  :primary-email [],
                  :signature [],
                  :project-explanation [],
                  :continuation-project [],
                  :organization [],
                  :project-measure [],
                  :combined-effort [],
                  :language [],
                  :project-www [],
                  :signature-email [],
                  :project-goals [],
                  :project-target [],
                  :project-announce [],
                  :project-end [{:error "maxlength", :max 10}]}
                 json)))

  (it "PUT should create a new form submission and return id when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" {:organization "Testi Organisaatio"
                                                                                     :primary-email "test@example.com"
                                                                                     :signature "Teemu Testaaja, CEO"
                                                                                     :signature-email "teemu@example.com"
                                                                                     :language "fi"
                                                                                     :combined-effort "no"
                                                                                     :other-organization-1 "E.T. Extra Terrestrial"
                                                                                     :other-organization-1-email "et@example"
                                                                                     :project-network "Verkko"
                                                                                     :project-goals "Maaleja"
                                                                                     :project-explanation "Selitys"
                                                                                     :project-target "Maali"
                                                                                     :project-measure "Mittaus"
                                                                                     :project-announce "Julkaisut"})
            json (json->map body)]
        (should= 200 status)
        (should= 1 (:id json))))

  (it "POST should validate required values when done to route /api/form/1/values/1"
    (let [{:keys [status headers body error] :as resp} (post! "/api/form/1/values/1" {:organization "Testi Organisaatio"
                                                                                      :primary-email "test@example.com"})
          json (json->map body)]
      (should= 400 status)
      (should= {:other-organization-1-email [{:error "required"}],
                :project-network [{:error "required"}],
                :other-organization-1 [{:error "required"}],
                :primary-email [],
                :signature [{:error "required"}],
                :project-explanation [{:error "required"}],
                :continuation-project [],
                :organization [],
                :project-measure [{:error "required"}],
                :combined-effort [{:error "required"}],
                :language [{:error "required"}],
                :project-www [],
                :signature-email [{:error "required"}],
                :project-goals [{:error "required"}],
                :project-target [{:error "required"}],
                :project-announce [{:error "required"}],
                :project-end []}
               json)))

  (it "POST should fail if done to non-existing node /api/form/1/values/2"
      (let [{:keys [status headers body error] :as resp} (post! "/api/form/1/values/2" {:foo "foo2"
                                                                                        :bar "bar2"})]
        (should= 404 status))))

(run-specs)
