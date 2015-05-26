(ns oph.va.server-spec
  (:use [clojure.tools.trace])
  (:require [speclj.core :refer :all]
            [oph.va.server :refer :all]
            [org.httpkit.client :as http]
            [cheshire.core :refer :all]))

(def base-url "http://localhost:9000")
(defn path->url [path] (str base-url path))
(defn get! [path] @(http/get (path->url path)))
(defn json->map [body] (parse-string body true))

(describe "HTTP server"

  ;; Start HTTP server for running tests
  (around-all [_]
              (let [stop-server (start-server "localhost" 9000 false)]
                (try (_) (finally (stop-server)))))

  (it "GET should return valid JSON from route /api/form"
      (let [{:keys [status headers body error] :as resp} (get! "/api/form")]
        (should= 200 status)
        (should= {:fields [{:displayAs "textField"
                            :description {:sv "Den sökandes namn"
                                          :fi "Hakijan nimi"}
                            :label {:sv "Namn"
                                    :fi "Nimi"}
                            :id "nimi"}
                           {:displayAs "textField"
                            :description {:sv "Den sökandes gatuaddress"
                                          :fi "Hakijan katuosoite"}
                            :label {:sv "Gatuaddress"
                                    :fi "Katuosoite"}
                            :id "osoite"}
                           {:displayAs "textArea"
                            :description {:sv ""
                                          :fi ""}
                            :label {:sv "Beskrivning"
                                    :fi "Kuvaus"}
                            :id "kuvaus"}]
                  :name {:sv "Testform"
                         :fi "Testilomake"}}
                 (json->map body)))))

(run-specs)
