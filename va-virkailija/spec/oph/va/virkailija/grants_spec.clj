(ns oph.va.virkailija.grants-spec
  (:use [clojure.tools.trace])
  (:require [speclj.core :refer [should should= describe it tags around-all]]
            [oph.va.virkailija.virkailija-server-spec :refer [get! json->map]]
            [oph.common.testing.spec-plumbing :refer [with-test-server!]]
            [oph.va.virkailija.server :refer [start-server]]))

(def test-server-port 9001)

(describe "Grants routes"

  (tags :server :grants)

  (around-all
    [_]
    (with-test-server!
      :virkailija-db
      #(start-server
         {:host "localhost"
          :port test-server-port
          :auto-reload? false
          :without-authentication? true}) (_)))

  (it "gets grants without content"
      (let [{:keys [status body]}
            (get! "/api/v2/grants/")
             grants (json->map body)]
        (should= 200 status)
        (should (some? grants))
        (should= 2 (count grants))
        (should (every? #(nil? (:content %)) grants))))

  (it "gets resolved grants with content"
      (let [{:keys [status body]}
            (get! "/api/v2/grants/?template=with-content")
            grants (json->map body)]
        (should= 200 status)
        (should (some? grants))
        (should= 1 (count grants))
        (should (every? #(some? (:content %)) grants)))))
