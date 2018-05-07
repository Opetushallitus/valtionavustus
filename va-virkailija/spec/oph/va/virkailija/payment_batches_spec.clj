(ns oph.va.virkailija.payment-batches-spec
  (:use [clojure.tools.trace])
  (:require [speclj.core :refer [should should= describe it tags around-all]]
            [oph.common.testing.spec-plumbing :refer [with-test-server!]]
            [oph.va.virkailija.server :refer [start-server]]
            [oph.va.virkailija.common-utils
             :refer [test-server-port get! post! json->map]]))

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
      (let [{:keys [status body]}
            (post! "/api/v2/payment-batches/" valid-payment-batch)]
        (should= 409 status)))

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
