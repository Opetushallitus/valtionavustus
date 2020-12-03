(ns oph.va.virkailija.payment-batches-spec
  (:require [speclj.core :refer [should should= describe
                                 it tags around-all run-specs after]]
            [clj-time.core :as t]
            [oph.common.testing.spec-plumbing :refer [with-test-server!]]
            [oph.va.virkailija.server :refer [start-server]]
            [oph.va.virkailija.common-utils
             :refer [test-server-port get! post! json->map create-submission
                     create-application create-application-evaluation
                     create-payment]]
            [oph.va.virkailija.payment-batches-data
             :refer [create-batch-document-email get-batch-documents
                     get-batch]]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.va.virkailija.virkailija-tools :as tools]))

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
      "virkailija"
      #(start-server
         {:host "localhost"
          :port test-server-port
          :auto-reload? false
          :without-authentication? true}) (_)))

  (after
    (tools/delete-payment-batches))

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
      (tools/create-batch
        (assoc valid-payment-batch
               :receipt-date "2018-02-02"
               :created-at "2018-08-08T06:12:40.194492+00"))
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
      (tools/create-batch
        (assoc valid-payment-batch
               :receipt-date "2018-02-02"
               :created-at "2018-08-08T06:12:40.194492+00"))
      (tools/create-batch
        (assoc valid-payment-batch
               :receipt-date "2018-02-02"
               :created-at "2018-08-09T06:12:40.194492+00"))
      (let [{:keys [status body]}
            (get! "/api/v2/payment-batches/?date=2018-04-17&grant-id=1")]
        (should= 200 status)
        (should (empty (json->map body))))))

(describe
  "Payment batches documents"

  (tags :server :batchdocuments)

  (after
    (tools/delete-payment-batches))

  (around-all
    [_]
    (with-test-server!
      "virkailija"
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

  (it "prevents multiple documents per phase"
      (let [{:keys [body]}
            (post! "/api/v2/payment-batches/"
                   (assoc valid-payment-batch
                          :receipt-date "2018-04-03"))
            batch (json->map body)
            batch-document {:document-id "ID1234567"
                            :presenter-email "presenter@local"
                            :acceptor-email "acceptor@local"
                            :phase 0}]
        (post!
          (format "/api/v2/payment-batches/%d/documents/" (:id batch))
          batch-document)
        (let [result
              (post!
                (format "/api/v2/payment-batches/%d/documents/" (:id batch))
                batch-document)]
          (should= 409 (:status result)))))

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

(describe
  "Payment batches emails"

  (tags :server :batchemails)

  (after
    (tools/delete-payment-batches))

  (around-all
    [_]
    (with-test-server!
      "virkailija"
      #(start-server
         {:host "localhost"
          :port test-server-port
          :auto-reload? false
          :without-authentication? true}) (_)))

  (it "create batch document email"
      (let [grant (-> (first (grant-data/get-grants))
                      (assoc-in [:content :document-type] "XE")
                      (assoc-in [:content :name] "Some Grant"))
            {:keys [body]}
            (post! "/api/v2/payment-batches/"
                   (assoc valid-payment-batch :receipt-date "2018-03-02"))
            batch (get-batch (:id (json->map body)))]
        (post!
                (format "/api/v2/payment-batches/%d/documents/" (:id batch))
                {:document-id "ID1234567"
                 :presenter-email "presenter@local"
                 :acceptor-email "acceptor@local"
                 :phase 0})
        (post!
                (format "/api/v2/payment-batches/%d/documents/" (:id batch))
                {:document-id "ID1234567"
                 :presenter-email "presenter@local"
                 :acceptor-email "acceptor@local"
                 :phase 1})

        (let [documents (get-batch-documents (:id batch))
              payments [(create-payment grant batch 0 20000)
                        (create-payment grant batch 0 35000)
                        (create-payment grant batch 1 50000)
                        (create-payment grant batch 1 10000)
                        (create-payment grant batch 1 40000)]
              email (create-batch-document-email
                      {:grant grant
                       :batch batch
                       :document (some #(when (= (:phase %) 0) %) documents)
                       :payments (filter #(= (:phase %) 0) payments)})]
          (should= ["presenter@local" "acceptor@local"] (:receivers email))
          (should (.startsWith (:batch-key email) (str "6600", (mod (t/year (t/now )) 100)) ))
          (should= "Some Grant" (:title email))
          (should= 2 (:count email))
          (should= 55000 (:total-granted email))))))

(run-specs)
