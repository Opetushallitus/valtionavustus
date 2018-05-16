(ns oph.va.virkailija.payment-batches-data-spec
  (:require [speclj.core :refer [describe it should= tags run-specs]]
            [oph.va.virkailija.payment-batches-data :as data]))

(def valid-values
  {:id 2
   :document-type "XA"
   :invoice-date "2018-04-13"
   :due-date "2018-04-27"
   :receipt-date "2018-04-27"
   :transaction-account "5000"
   :currency "EUR"
   :partner "001100"
   :inspector-email "test@test.test"
   :acceptor-email "test2@test.test"
   :grant-id 1
   :document-id "ID1234567"})

(def valid-application
  {:id 1
   :version 1})

(def payments
  [{:id 1 :state 0}
   {:id 2 :state 1}
   {:id 3 :state 2}
   {:id 4 :state 1}])

(describe "Create payment data"
          (tags :paymentbatch)
          (it "creates payment values of valid batch values"
              (should= {:application-id 1
                        :application-version 1
                        :state 0
                        :batch-id 2
                        :payment-sum 2500}
                       (data/create-payment-data
                         valid-application valid-values 2500))))

(describe "Create filename"
          (tags :paymentbatch)
          (it "creates filename"
              (should= "payment-1-1234.xml"
                       (data/create-filename {:id 1} #(int 1234)))))

(describe "Get unpaid payments"
          (tags :paymentbatch)
          (it "finds unpaid payments"
              (should= {:id 1 :state 0}
                       (data/get-unpaid-payment payments)))
          (it "finds unpaid payments after paid one"
              (should= {:id 4 :state 1}
                       (data/get-unpaid-payment (subvec payments 2)))))

(run-specs)
