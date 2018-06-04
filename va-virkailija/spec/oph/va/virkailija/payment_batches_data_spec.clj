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

(describe "Create filename"
          (tags :paymentbatch)
          (it "creates filename"
              (should= "payment-1-1234.xml"
                       (data/create-filename {:id 1} #(int 1234)))))

(run-specs)
