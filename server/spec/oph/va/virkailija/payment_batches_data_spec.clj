(ns oph.va.virkailija.payment-batches-data-spec
  (:require [speclj.core :refer [describe it should= tags run-specs]]
            [oph.va.virkailija.payment-batches-data :as data]))

(def valid-values
  {:id 2
   :invoice-date "2018-04-13"
   :due-date "2018-04-27"
   :receipt-date "2018-04-27"
   :currency "EUR"
   :partner "001100"
   :grant-id 1})

(def valid-application
  {:id 1
   :version 1})

(def payments
  [{:id 1 :paymentstatus-id "created"}
   {:id 2 :paymentstatus-id "waiting"}
   {:id 3 :paymentstatus-id "sent"}
   {:id 4 :paymentstatus-id "waiting"}])

(describe "Create filename"
          (tags :paymentbatch)
          (it "creates filename"
              (should= "payment-1-1234.xml"
                       (data/create-filename {:id 1} #(int 1234)))))

(run-specs)
