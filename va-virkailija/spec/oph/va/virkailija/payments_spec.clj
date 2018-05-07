(ns oph.va.virkailija.payments-spec
  (require [speclj.core
            :refer [should should-not should= describe
                    it tags around-all run-specs]]
           [oph.common.testing.spec-plumbing :refer [with-test-server!]]
           [oph.va.virkailija.server :refer [start-server]]
           [oph.va.virkailija.payments-data :as payments-data]
           [oph.va.virkailija.payment-batches-data :as payment-batches-data]
           [oph.va.virkailija.grant-data :as grant-data]
           [clj-time.core :as t]
           [oph.va.virkailija.common-utils
            :refer [test-server-port get! post! create-submission
                    create-application json->map admin-authentication
                    valid-payment-values delete! add-mock-authentication
                    remove-mock-authentication]]))

(def payment-date (java.time.LocalDate/of 2018 5 2))

(def example-identity {:person-oid "12345"
                       :first-name "Test"
                       :surname "User"})

(defn create-payment [grant]
  (let [submission (create-submission (:form grant)
                                             {:budget-oph-share 40000})
        application (create-application grant submission)
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
                        :auto-reload? false
                        :without-authentication? true}) (_)))

  (it "finds payments by register number and invoice date"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission
                         (:form grant) {:budget-oph-share 40000})
            application (create-application grant submission)
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
      (let [grant (first (grant-data/get-grants))]
        (payments-data/delete-grant-payments (:id grant))
        (let [payment1 (create-payment grant)
              payment2 (create-payment grant)
              response (get!
                         (str "/api/v2/grants/" (:id grant) "/payments/"))]
          (should= 200 (:status response))
          (should= 2 (count (json->map (:body response)))))))

  (it "gets application payments history"
      (let [grant (first (grant-data/get-grants))]
        (payments-data/delete-grant-payments (:id grant))
        (let [submission (create-submission
                           (:form grant) {:budget-oph-share 40000})
              application (create-application grant submission)
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
              payment1 (payments-data/create-payment
                         {:application-id (:id application)
                          :payment-sum 20000
                          :batch-id (:id batch)
                          :state 1}
                         example-identity)
              payment2 (payments-data/create-payment
                         {:application-id (:id application)
                          :payment-sum 20000
                          :batch-id (:id batch)
                          :state 1}
                         example-identity)]
          (payments-data/update-payment
            (assoc payment1 :state 2 :filename "example.xml") example-identity)

          (let [response
                (get!
                  (str "/api/v2/applications/"
                       (:id application) "/payments-history/"))]
            (should= 200 (:status response))
            (let [payments (json->map (:body response))
                  payment (some #(when (= (:state %) 2) %) payments)]
              (should= 3 (count payments))
              (should= (:id payment1) (:id payment))
              (should= 1 (:version payment)))))))

  (it "gets grant payments info"
      (let [grant (first (grant-data/get-grants))]
        (payments-data/delete-grant-payments (:id grant))
        (let [submission (create-submission
                           (:form grant) {:budget-oph-share 40000})
              application (create-application grant submission)
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
              payment1 (payments-data/create-payment
                         {:application-id (:id application)
                          :payment-sum 20000
                          :batch-id (:id batch)
                          :state 1}
                         example-identity)
              payment2 (payments-data/create-payment
                         {:application-id (:id application)
                          :payment-sum 30000
                          :batch-id (:id batch)
                          :state 1}
                         example-identity)
              payment3 (payments-data/create-payment
                         {:application-id (:id application)
                          :payment-sum 25000
                          :batch-id (:id batch)
                          :state 1}
                         example-identity)]
          (payments-data/update-payment
            (assoc payment1 :state 2 :filename "example.xml") example-identity)
          (payments-data/update-payment
            (assoc payment2 :state 2 :filename "example.xml") example-identity)

          (let [payments-info (payments-data/get-batch-payments-info
                                (:id batch))]
            (should= 50000 (:total-granted payments-info))
            (should= 2 (:count payments-info))))))

  (it "creates payments email"
      (let [grant (first (grant-data/get-grants true))]
        (payments-data/delete-grant-payments (:id grant))
        (let [submission (create-submission
                           (:form grant) {:budget-oph-share 40000})
              application (create-application grant submission)
              batch (payment-batches-data/create-batch
                      {:receipt-date payment-date
                       :due-date payment-date
                       :partner ""
                       :grant-id (:id grant)
                       :document-id ""
                       :currency "EUR"
                       :invoice-date payment-date
                       :document-type "XA"
                       :transaction-account "6600"
                       :acceptor-email "acceptor@local"
                       :inspector-email "inspector@local"})
              payment1 (payments-data/create-payment
                         {:application-id (:id application)
                          :payment-sum 20000
                          :batch-id (:id batch)
                          :state 1}
                         example-identity)
              payment2 (payments-data/create-payment
                         {:application-id (:id application)
                          :payment-sum 30000
                          :batch-id (:id batch)
                          :state 1}
                         example-identity)
              payment3 (payments-data/create-payment
                         {:application-id (:id application)
                          :payment-sum 25000
                          :batch-id (:id batch)
                          :state 1}
                         example-identity)]
          (payments-data/update-payment
            (assoc payment1 :state 2 :filename "example.xml") example-identity)
          (payments-data/update-payment
            (assoc payment2 :state 2 :filename "example.xml") example-identity)
          (prn grant)

          (let [payments-email
                (payments-data/create-payments-email
                  {:batch-id (:id batch)
                   :acceptor-email "acceptor@local"
                   :inspector-email "inspector@local"
                   :receipt-date payment-date
                   :grant-id (:id grant)
                   :organisation "6600"
                   :batch-number (:batch-number batch)})]
            (should= {:receivers ["inspector@local" "acceptor@local"]
                      :batch-key (format "6600%02d%03d"
                                         (mod (.getYear payment-date) 100)
                                         (:batch-number batch))
                      :title (get-in grant [:content :name])
                      :date (payments-data/format-email-date
                              (t/now))
                      :count 2
                      :total-granted 50000}
                     payments-email))))))

(describe
  "Payments routes"

  (tags :server :payments :paymentroutes)

  (around-all
    [_]
    (add-mock-authentication admin-authentication)
    (with-test-server!
      :virkailija-db
      #(start-server
         {:host "localhost"
          :port test-server-port
          :auto-reload? false
          :without-authentication? true}) (_))
    (remove-mock-authentication admin-authentication))

  (it "creates new payment"
      (let [{:keys [body]} (get! "/api/v2/grants/")
            grant (first (json->map body))
            submission (create-submission (:form grant) {})
            application (create-application grant submission)
            payment-values (assoc valid-payment-values
                                  :application-id (:id application)
                                  :application-version (:version application))
            {:keys [status body]}
            (post! "/api/v2/payments/" payment-values)]
        (should= 200 status)
        (should= (assoc payment-values
                        :version 0)
                 (dissoc (json->map body) :id))))

  (it "deletes created payment"
      (let [{:keys [body]} (get! "/api/v2/grants/")
            grant (first (json->map body))
            submission (create-submission (:form grant) {})
            application (create-application grant submission)
            payment-values (assoc valid-payment-values
                                  :application-id (:id application)
                                  :application-version (:version application))
            {:keys [body]}
            (post! "/api/v2/payments/" payment-values)
            payment (json->map body)]
        (should (some? (payments-data/get-payment (:id payment))))
        (let [{:keys [status body]}
              (delete! (format "/api/v2/payments/%d/" (:id payment)))]
          (should= 200 status)
          (should= nil (payments-data/get-payment (:id payment))))))

  (it "prevents delete of older payment"
      (let [{:keys [body]} (get! "/api/v2/grants/")
            grant (first (json->map body))
            submission (create-submission (:form grant) {})
            application (create-application grant submission)
            payment-values (assoc valid-payment-values
                                  :application-id (:id application)
                                  :application-version (:version application))
            {:keys [body]}
            (post! "/api/v2/payments/" payment-values)
            payment
            (payments-data/update-payment
              (assoc (json->map body) :state 2 :filename "")
              {:person-oid "" :first-name "" :surname ""})
            {:keys [status body]}
            (delete! (format "/api/v2/payments/%d/" (:id payment)))]
        (should= 400 status)
        (should (some? (payments-data/get-payment (:id payment)))))))

(run-specs)
