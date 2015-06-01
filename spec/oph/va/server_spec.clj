(ns oph.va.server-spec
  (:use [clojure.tools.trace])
  (:require [speclj.core :refer :all]
            [org.httpkit.client :as http]
            [cheshire.core :refer :all]
            [oph.va.spec-plumbing :refer :all]))

(def base-url "http://localhost:9000")
(defn path->url [path] (str base-url path))
(defn get! [path] @(http/get (path->url path)))
(defn json->map [body] (parse-string body true))

(describe "HTTP server"

  ;; Start HTTP server for running tests
  (around-all [_] (with-test-server! (_)))

  (it "GET should return valid JSON from route /api/form"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form")
            json (json->map body)]
        (should= 200 status)
        (should= "Laatustrategian toimeenpanon tuki" (-> json first :content :name :fi)))))

(run-specs)
