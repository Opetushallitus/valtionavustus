(ns oph.va.virkailija.server-spec
  (:use [clojure.tools.trace])
  (:require [clojure.string :as string]
            [speclj.core :refer :all]
            [org.httpkit.client :as http]
            [cheshire.core :refer :all]
            [clj-time.format :as f]
            [clj-time.local :as l]
            [oph.va.virkailija.spec-plumbing :refer :all]))

(def base-url "http://localhost:9001")
(defn path->url [path] (str base-url path))
(defn get! [path] @(http/get (path->url path) {:as :text}))
(defn put! [path body] @(http/put (path->url path) {:body (generate-string body true)
                                                    :headers {"Content-Type" "application/json"}}))
(defn post! [path body] @(http/post (path->url path) {:body (generate-string body true)
                                                      :headers {"Content-Type" "application/json"}}))
(defn json->map [body] (parse-string body true))

(defn find-by-id [json id] (first (filter (fn [e] (.equals ( :id e) id)) (-> (validation/flatten-elements (json :content))))))

(defn update-answers [answers key value]
  (let [update-fn (fn [key new-value] (fn [value]
                                        (if (= (:key value) key)
                                          {:key key :value new-value}
                                          value)))]
    {:value (map (update-fn key value) (:value answers))}))

(describe "HTTP server"

  (tags :server)

  ;; Start HTTP server for running tests
  (around-all [_] (with-test-server! (_)))

  (it "GET should return valid form JSON from route /api/form/1"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1")
            json (json->map body)]
        (should= 200 status))))

(run-specs)
