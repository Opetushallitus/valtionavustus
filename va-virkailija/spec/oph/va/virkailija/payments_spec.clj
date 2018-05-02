(ns oph.va.virkailija.payments-spec
  (require [speclj.core
            :refer [should should-not should= describe it tags around-all]]
           [oph.common.testing.spec-plumbing :refer [with-test-server!]]
           [oph.va.virkailija.server :refer [start-server]]
           [oph.va.virkailija.payments-data :as payments-data]
           [oph.va.virkailija.payment-batches-data :as payment-batches-data]
           [oph.va.virkailija.grant-data :as grant-data]
           [oph.va.virkailija.virkailija-server-spec :as server]))

(def test-server-port 9001)

(def payment-date (java.time.LocalDate/of 2018 5 2))

(defn create-payment [grant]
  (let [submission (server/create-submission (:form grant)
                                             {:budget-oph-share 40000})
        application (server/create-application grant submission)
        batch (payment-batches-data/create-batch
                {:receipt-date payment-date
                 :due-date payment-date
                 :partner ""
                 :grant-id (:id grant)
                 :document-id ""
                 :currency "EUR"
                 :invoice-date payment-date
                 :document-type "XA"
                 :transaction-account "6000"
                 :acceptor-email "acceptor@local"
                 :inspector-email "inspector@local"})]
    (payments-data/create-payment
              {:application-id (:id application)
               :payment-sum 20000
               :batch-id (:id batch)
               :state 1}
              {:person-oid "12345"
               :first-name "Test"
               :surname "User"})))

(describe
  "Get and find payments"

  (tags :payments :paymentsdata)

  (around-all [_] (with-test-server! :virkailija-db
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false}) (_)))

  (it "finds payments by register number and invoice date"
      (let [grant (first (grant-data/get-grants))
            submission (server/create-submission (:form grant)
                                                 {:budget-oph-share 40000})
            application (server/create-application grant submission)
            batch (payment-batches-data/create-batch
                    {:receipt-date payment-date
                     :due-date payment-date
                     :partner ""
                     :grant-id (:id grant)
                     :document-id ""
                     :currency "EUR"
                     :invoice-date payment-date
                     :document-type "XA"
                     :transaction-account "6000"
                     :acceptor-email "acceptor@local"
                     :inspector-email "inspector@local"})
            payment (payments-data/create-payment
                      {:application-id (:id application)
                       :payment-sum 20000
                       :batch-id (:id batch)
                       :state 1}
                      {:person-oid "12345"
                       :first-name "Test"
                       :surname "User"})]
        (should=
          (select-keys payment [:id :version])
          (select-keys
            (first (payments-data/find-payments-by-response
                     {:register-number (:register_number application)
                      :invoice-date "2018-05-02"}))
            [:id :version]))
        (should
          (empty? (payments-data/find-payments-by-response
                    {:register-number (:register_number application)
                     :invoice-date "2018-05-03"})))))

  (it "finds payments by grant"
      (let [grant (first (grant-data/get-grants))
            payment1 (create-payment grant)
            payment2 (create-payment grant)]

        (should= 2 (count (payments-data/get-grant-payments (:id grant)))))))
