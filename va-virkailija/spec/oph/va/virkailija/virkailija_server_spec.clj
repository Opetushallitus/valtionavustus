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

(def valid-payment-batch
  {:document-type "XA"
   :invoice-date "2018-04-16"
   :due-date "2018-04-30"
   :receipt-date "2018-04-16"
   :transaction-account "5000"
   :currency "EUR"
   :partner "123456"
   :inspector-email "no.one@email.local"
   :acceptor-email "no.two@email.local"
   :grant-id 1
   :document-id "ID1234567890"})

(describe "HTTP server"

  (tags :server)

  ;; Start HTTP server for running tests
  (around-all [_] (with-test-server! :virkailija-db #(start-server "localhost" test-server-port false) (_)))

  (it "GET to / without authentication should redirect to login page"
      (let [{:keys [status body]} (get! "/")]
        (should= 200 status)
        (should-contain #"login" body))))

(describe "Payment batches routes"

  (tags :server :paymentbatches)

  (around-all
    [_]
    (with-test-server!
      :virkailija-db
      #(start-server "localhost" test-server-port false true) (_)))

  (it "creates payment batch"
      (let [{:keys [status body]}
            (post! "/api/v2/payment-batches/" valid-payment-batch)]
        (should= 200 status)
        (should= valid-payment-batch
                 (dissoc (json->map body) :id :batch-number))))

  (it "find payment batch (finds one)"
      (let [{:keys [status body]}
            (get!
              (format "/api/v2/payment-batches/?date=%s&grant-id=%d"
                      (:receipt-date valid-payment-batch)
                      (:grant-id valid-payment-batch)))
            batch (json->map body)]
        (should= 200 status)
        (should (some? batch))
        (should= valid-payment-batch
                 (dissoc batch :id :batch-number :created-at))))

  (it "find payment batch (not found any)"
      (let [{:keys [status body]}
            (get! "/api/v2/payment-batches/?date=2018-04-17&grant-id=1")]
        (should= 204 status)
        (should= 0 (count (json->map body))))))

(run-specs)
