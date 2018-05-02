(ns oph.va.virkailija.payments-spec
  (require [speclj.core
            :refer [should should-not should= describe it tags around-all]]
           [oph.common.testing.spec-plumbing :refer [with-test-server!]]
           [oph.va.virkailija.server :refer [start-server]]
           [oph.va.virkailija.payments-data :as payments-data]
           [oph.va.virkailija.grant-data :as grant-data]
           [oph.va.virkailija.virkailija-server-spec :as server]))

(def test-server-port 9001)

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
            payment (payments-data/create-payment
                      {:application-id (:id application)
                       :payment-sum 20000
                       :invoice-date "2018-05-02"}
                      {:user-oid "12345"
                       :user-name "Test User"})]
        (should=
          (select-keys payment [:id :version])
          (select-keys
            (payments-data/find-payments-by-response
              {:register-number (:register_number application)
               :invoice-date "2018-05-02"}
              (:register_number application))
            [:id :version]))
        (should
          (nil? (payments-data/find-payments-by-response
                  {:register-number (:register_number application)
                   :invoice-date "2018-05-03"}
                  (:register_number application)))))))
