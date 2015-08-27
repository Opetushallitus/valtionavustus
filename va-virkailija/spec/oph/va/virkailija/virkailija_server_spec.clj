(ns oph.va.virkailija.virkailija-server-spec
  (:use [clojure.tools.trace])
  (:require [clojure.string :as string]
            [speclj.core :refer :all]
            [org.httpkit.client :as http]
            [cheshire.core :refer :all]
            [clj-time.format :as f]
            [clj-time.local :as l]
            [oph.common.testing.spec-plumbing :refer :all]
            [oph.va.virkailija.server :refer :all]))

(def test-server-port 9001)
(def base-url (str "http://localhost:" test-server-port))
(defn path->url [path] (str base-url path))
(defn get! [path] @(http/get (path->url path) {:as :text}))
(defn put! [path body] @(http/put (path->url path) {:body (generate-string body true)
                                                    :headers {"Content-Type" "application/json"}}))
(defn post! [path body] @(http/post (path->url path) {:body (generate-string body true)
                                                      :headers {"Content-Type" "application/json"}}))
(defn json->map [body] (parse-string body true))

(describe "HTTP server"

  (tags :server)

  ;; Start HTTP server for running tests
  (around-all [_] (with-test-server! :db #(start-server "localhost" test-server-port false) (_)))

  (it "GET should return valid form JSON from route /api/form/1"
      (pending "To be fixed")
      (let [{:keys [status headers body error] :as resp} (get! "/api/form/1")
            json (json->map body)]
        (should= 200 status))))

(run-specs)
