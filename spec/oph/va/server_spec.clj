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
        (should= "Laatustrategian toimeenpanon tuki" (-> json :content :name :fi))))

  (it "GET should return valid empty form values from route /api/form/1/values/1"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1/values/1")
            json (json->map body)]
        (should= 200 status)
        (should= true (empty? json))))

  (it "PUT should validate required values when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" {:tiedotus "foo"
                                                                                     :kohderyhma "bar"})]
        (should= 400 status)
        (should= "{\"tiedotus\":[],\"kohderyhma\":[],\"kuvaus\":[\"required\"],\"arviointi\":[\"required\"],\"alue\":[\"required\"],\"nimi\":[\"required\"],\"paikkakunnat\":[\"required\"],\"uusi\":[\"required\"],\"tavoitteet\":[\"required\"],\"www-osoite\":[]}" body)))

  (it "PUT should create a new form submission and return id when done to route /api/form/1/values"
      (let [{:keys [status headers body error] :as resp} (put! "/api/form/1/values" {:tiedotus "testi"
                                                                                     :kohderyhma "testi"
                                                                                     :kuvaus "testi"
                                                                                     :arviointi "testi"
                                                                                     :nimi "testi"
                                                                                     :paikkakunnat "testi"
                                                                                     :uusi "testi"
                                                                                     :tavoitteet "testi"
                                                                                     :alue "testi"})]
        (should= 200 status)
        (should= "1" body)))

  (it "POST should validate required values when done to route /api/form/1/values/1"
    (let [{:keys [status headers body error] :as resp} (post! "/api/form/1/values/1" {:tiedotus "foo"
                                                                                      :kohderyhma "bar"})]
      (should= 400 status)
      (should= "{\"tiedotus\":[],\"kohderyhma\":[],\"kuvaus\":[\"required\"],\"arviointi\":[\"required\"],\"alue\":[\"required\"],\"nimi\":[\"required\"],\"paikkakunnat\":[\"required\"],\"uusi\":[\"required\"],\"tavoitteet\":[\"required\"],\"www-osoite\":[]}" body))))

(run-specs)
