(ns oph.va.virkailija.payment-batches-spec
  (:use [clojure.tools.trace])
  (:require [speclj.core :refer [should should= describe
                                 it tags around-all run-specs]]
            [oph.common.testing.spec-plumbing :refer [with-test-server!]]
            [oph.va.virkailija.server :refer [start-server]]
            [oph.va.virkailija.common-utils
             :refer [test-server-port get! post! json->map]]))

(def valid-payment-batch
  {:invoice-date "2018-04-16"
   :due-date "2018-04-30"
   :receipt-date "2018-04-16"
   :currency "EUR"
   :partner "123456"
   :grant-id 1})

(describe "Payment batches routes"

  (tags :server :paymentbatches)

  (around-all
    [_]
    (with-test-server!
      :virkailija-db
      #(start-server
         {:host "localhost"
          :port test-server-port
          :auto-reload? false
          :without-authentication? true}) (_)))

  (it "creates payment batch"
      (let [{:keys [status body]}
            (post! "/api/v2/payment-batches/" valid-payment-batch)]
        (should= 200 status)
        (should= valid-payment-batch
                 (dissoc (json->map body) :id :batch-number))))

  (it "prevents duplicate payment batches"
      (post! "/api/v2/payment-batches/"
             (assoc valid-payment-batch :receipt-date "2018-01-02"))
      (let [{:keys [status body]}
            (post! "/api/v2/payment-batches/"
                   (assoc valid-payment-batch :receipt-date "2018-01-02"))]
        (should= 409 status)))

  (it "find payment batch (finds one)"
      (post! "/api/v2/payment-batches/"
             (assoc valid-payment-batch :receipt-date "2018-02-02"))
      (let [{:keys [status body]}
            (get!
              (format "/api/v2/payment-batches/?date=%s&grant-id=%d"
                      "2018-02-02"
                      (:grant-id valid-payment-batch)))
            batches (json->map body)]
        (should= 200 status)
        (should= 1 (count batches))
        (should (some? (first batches)))
        (should= (assoc valid-payment-batch :receipt-date "2018-02-02")
                 (dissoc (first batches) :id :batch-number :created-at))))

  (it "find payment batch (not found any)"
      (let [{:keys [status body]}
            (get! "/api/v2/payment-batches/?date=2018-04-17&grant-id=1")]
        (should= 200 status)
        (should (empty (json->map body))))))

(describe
  "Payment batches documents"

  (tags :server :batchdocuments)

  (around-all
    [_]
    (with-test-server!
      :virkailija-db
      #(start-server
         {:host "localhost"
          :port test-server-port
          :auto-reload? false
          :without-authentication? true}) (_)))

  (it "creates batch document"
      (let [{:keys [body]}
            (post! "/api/v2/payment-batches/" valid-payment-batch)
            batch (json->map body)
            batch-document {:document-id "ID1234567"
                            :presenter-email "presenter@local"
                            :acceptor-email "acceptor@local"
                            :phase 0}
            result
            (post!
              (format "/api/v2/payment-batches/%d/documents/" (:id batch))
              batch-document)]
        (should= 200 (:status result))
        (should= batch-document
                 (dissoc (json->map (:body result)) :id :created-at))))

  (it "get batch documents"
      (let [{:keys [body]}
            (post! "/api/v2/payment-batches/"
                   (assoc valid-payment-batch :receipt-date "2018-03-02"))
            batch (json->map body)]
        (post!
          (format "/api/v2/payment-batches/%d/documents/" (:id batch))
          {:document-id "ID1234567"
           :presenter-email "presenter@local"
           :acceptor-email "acceptor@local"
           :phase 0})
        (post!
          (format "/api/v2/payment-batches/%d/documents/" (:id batch))
          {:document-id "ID12345678"
           :presenter-email "presenter2@local"
           :acceptor-email "acceptor2@local"
           :phase 1})

        (let [result
              (get! (format
                      "/api/v2/payment-batches/%d/documents/" (:id batch)))]
          (should= 200 (:status result))
          (should= 2 (count (json->map (:body result))))))))

(run-specs)
