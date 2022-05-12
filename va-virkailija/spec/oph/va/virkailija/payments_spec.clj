(ns oph.va.virkailija.payments-spec
  (:require [speclj.core
            :refer [should should-not should= describe
                    it tags around-all run-specs]]
           [oph.common.testing.spec-plumbing :refer [with-test-server!]]
           [oph.va.virkailija.server :refer [start-server]]
           [oph.va.virkailija.payments-data :as payments-data]
           [oph.va.virkailija.payment-batches-data :as payment-batches-data]
           [oph.va.virkailija.grant-data :as grant-data]
           [oph.va.virkailija.application-data :as application-data]
           [clj-time.core :as t]
           [oph.va.virkailija.common-utils
            :refer [test-server-port get! post! create-submission
                    create-application json->map admin-authentication
                    valid-payment-values delete! add-mock-authentication
                    remove-mock-authentication create-application-evaluation
                    create-valiselvitys]]))

(def payment-date (java.time.LocalDate/of 2018 5 2))

(def example-identity {:person-oid "12345"
                       :first-name "Test"
                       :surname "User"})

(defn create-payment [grant]
  (let [submission (create-submission
                     (:form grant) {:budget-oph-share 40000})
        application (create-application grant submission)
        evaluation (create-application-evaluation application "accepted")
        batch (payment-batches-data/create-batch
                {:receipt-date payment-date
                 :due-date payment-date
                 :partner ""
                 :grant-id (:id grant)
                 :currency "EUR"
                 :invoice-date payment-date})]
    (payments-data/create-payment
              {:application-id (:id application)
               :payment-sum 20000
               :batch-id (:id batch)
               :paymentstatus-id "waiting"
               :phase 0}
              {:person-oid "12345"
               :first-name "Test"
               :surname "User"})))

(describe
  "Get and find payments"

  (tags :payments :paymentsdata)

  (around-all [_] (with-test-server! "virkailija"
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false
                        :without-authentication? true}) (_)))

  (it "finds payments by register number and phase"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission
                         (:form grant) {:budget-granted 40000})
            application (create-application grant submission)
            batch (payment-batches-data/create-batch
                    {:receipt-date payment-date
                     :due-date payment-date
                     :partner ""
                     :grant-id (:id grant)
                     :currency "EUR"
                     :invoice-date payment-date})
            payment (payments-data/create-payment
                      {:application-id (:id application)
                       :payment-sum 20000
                       :batch-id (:id batch)
                       :paymentstatus-id "waiting"
                       :phase 1}
                      {:person-oid "12345"
                       :first-name "Test"
                       :surname "User"})]
        (let [payments (payments-data/find-payments-by-response
                         {:register-number
                          (str (:register_number application) "_2")
                          :invoice-date "2018-05-02"})]
          (should= 1 (count payments))
          (should=
            (select-keys payment [:id :version])
            (select-keys (first payments) [:id :version])))
        (should
          (empty? (payments-data/find-payments-by-response
                    {:register-number (:register_number application)
                     :invoice-date "2018-05-03"})))))

  (it "finds multiple payments by register number and phase and ignores valiselvitys"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission
                         (:form grant) {:budget-granted 40000})
            application (create-application grant submission)
            valiselvitys (create-valiselvitys
                           application
                           (create-submission
                             (:form grant) {}))
            batch (payment-batches-data/create-batch
                    {:receipt-date payment-date
                     :due-date payment-date
                     :partner ""
                     :grant-id (:id grant)
                     :currency "EUR"
                     :invoice-date payment-date})
            payment1 (payments-data/create-payment
                       {:application-id (:id application)
                        :payment-sum 20000
                        :batch-id (:id batch)
                        :paymentstatus-id "waiting"
                        :phase 0}
                       {:person-oid "12345"
                        :first-name "Test"
                        :surname "User"})
            payment2 (payments-data/create-payment
                       {:application-id (:id application)
                        :payment-sum 20000
                        :batch-id (:id batch)
                        :paymentstatus-id "waiting"
                        :phase 1}
                       {:person-oid "12345"
                        :first-name "Test"
                        :surname "User"})]
        (let [payments (payments-data/find-payments-by-response
                         {:register-number
                          (str (:register_number application) "_1")
                          :invoice-date "2018-05-02"})]
          (should= 1 (count payments))
          (should=
            (select-keys payment1 [:id :version])
            (select-keys (first payments) [:id :version])))
        (let [payments (payments-data/find-payments-by-response
                         {:register-number
                          (str (:register_number application) "_2")
                          :invoice-date "2018-05-02"})]
          (should= 1 (count payments))
          (should=
            (select-keys payment2 [:id :version])
            (select-keys (first payments) [:id :version])))
        (should
          (empty? (payments-data/find-payments-by-response
                    {:register-number (str (:register_number application) "_3")
                     :invoice-date "2018-05-03"})))))

  (it "finds payments by register number of first batch"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission
                         (:form grant) {:budget-granted 40000})
            application (create-application grant submission)
            batch (payment-batches-data/create-batch
                    {:receipt-date payment-date
                     :due-date payment-date
                     :partner ""
                     :grant-id (:id grant)
                     :currency "EUR"
                     :invoice-date payment-date})
            payment (payments-data/create-payment
                      {:application-id (:id application)
                       :payment-sum 20000
                       :batch-id (:id batch)
                       :paymentstatus-id "waiting"
                       :phase 0}
                      {:person-oid "12345"
                       :first-name "Test"
                       :surname "User"})
            payments (payments-data/find-payments-by-response
                       {:register-number (str (:register_number application) "_1")
                        :invoice-date "2018-05-02"})]
        (should=
          (select-keys payment [:id :version])
          (select-keys
            (first payments)
            [:id :version]))))

  (it "finds payments by register number of first batch fall back"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission
                         (:form grant) {:budget-granted 40000})
            application (create-application grant submission)
            batch (payment-batches-data/create-batch
                    {:receipt-date payment-date
                     :due-date payment-date
                     :partner ""
                     :grant-id (:id grant)
                     :currency "EUR"
                     :invoice-date payment-date})
            payment (payments-data/create-payment
                      {:application-id (:id application)
                       :payment-sum 20000
                       :batch-id (:id batch)
                       :paymentstatus-id "waiting"
                       :phase 0}
                      {:person-oid "12345"
                       :first-name "Test"
                       :surname "User"})]
        (let [payments (payments-data/find-payments-by-response
                         {:register-number (:register_number application)
                          :invoice-date "2018-05-02"})]
          (should= 1 (count payments))
          (should=
            (select-keys payment [:id :version])
            (select-keys
              (first payments)
              [:id :version])))))

  (it "finds payments by grant"
      (let [grant (first (grant-data/get-grants))]
        (payments-data/delete-grant-payments (:id grant))
        (let [payment1 (create-payment grant)
              payment2 (create-payment grant)
              response (get!
                         (str "/api/v2/grants/" (:id grant) "/payments/"))]
          (should= 200 (:status response))
          (should= 2 (count (json->map (:body response))))))))

(describe
  "Payments routes"

  (tags :server :payments :paymentroutes)

  (around-all
    [_]
    (add-mock-authentication admin-authentication)
    (with-test-server!
      "virkailija"
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
                                  :application-version (:version application)
                                  :phase 0)
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
                                  :application-version (:version application)
                                  :phase 0)
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
                                  :application-version (:version application)
                                  :phase 0)
            {:keys [body]}
            (post! "/api/v2/payments/" payment-values)
            payment
            (payments-data/update-payment
              (assoc (json->map body) :paymentstatus-id "sent" :filename "")
              {:person-oid "" :first-name "" :surname ""})
            {:keys [status body]}
            (delete! (format "/api/v2/payments/%d/" (:id payment)))]
        (should= 400 status)
        (should (some? (payments-data/get-payment (:id payment)))))))

(describe
  "Prepare application"

  (tags :payments :validatingapplication)

  (around-all [_] (with-test-server! "virkailija"
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false
                        :without-authentication? true}) (_)))

  (it "validates application for creating first payment"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission (:form grant)
                                          {:budget-granted 40000})
            application (create-application grant submission)]
        (should (payments-data/valid-for-payment?
                      (assoc application :status "accepted")))
        (should-not (payments-data/valid-for-payment?
                      (assoc application :should-pay false)))
        (should-not (payments-data/valid-for-payment?
                      (assoc application :refused true)))
        (should-not (payments-data/valid-for-payment?
                      (assoc application :status "rejected")))

        (payments-data/create-payment
              {:application-id (:id application)
               :payment-sum 20000
               :batch-id nil
               :paymentstatus-id "waiting"
               :phase 0}
              {:person-oid "12345"
               :first-name "Test"
               :surname "User"})
        (should-not (payments-data/valid-for-payment?
                      (assoc application :status "accepted")))))

  (it "gets first payment sum"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission (:form grant) {})
            created-application (create-application grant submission)
            application-raw (application-data/get-application
                              (:id created-application))
            evaluation (create-application-evaluation
                         application-raw "accepted")
            application (application-data/get-application
                          (:id application-raw))]

        (should= 1500000
                 (payments-data/get-first-payment-sum
                   (assoc application :budget-granted 1500000) grant))
        (should= 50000
                 (payments-data/get-first-payment-sum
                   (assoc application :budget-granted 50000) grant))
        (should= 25000
                 (payments-data/get-first-payment-sum
                   (assoc application :budget-granted 50000)
                   (-> grant
                     (assoc-in [:content :multiplemaksuera] true)
                     (assoc-in [:content :payment-size-limit] "no-limit")
                     (assoc-in [:content :payment-min-first-batch] 50))))
        (should= 25000
                 (payments-data/get-first-payment-sum
                   (assoc application :budget-granted 50000)
                   (-> grant
                     (assoc-in [:content :multiplemaksuera] true)
                     (assoc-in [:content :payment-size-limit] "fixed-limit")
                     (assoc-in [:content :payment-fixed-limit] 20000)
                     (assoc-in [:content :payment-min-first-batch] 50))))
        (should= 50000
                 (payments-data/get-first-payment-sum
                   (assoc application :budget-granted 50000)
                   (-> grant
                     (assoc-in [:content :multiplemaksuera] true)
                     (assoc-in [:content :payment-size-limit] "fixed-limit")
                     (assoc-in [:content :payment-fixed-limit] 52000)
                     (assoc-in [:content :payment-min-first-batch] 50))))
        (should= 60000
                 (payments-data/get-first-payment-sum
                   (assoc application :budget-granted 100000)
                   (-> grant
                     (assoc-in [:content :multiplemaksuera] true)))))))

(describe
  "Payments data functions"

  (tags :server :payments :paymentsfunctions)

  (around-all
    [_]
    (with-test-server!
      "virkailija"
      #(start-server
         {:host "localhost"
          :port test-server-port
          :auto-reload? false}) (_)))

  (it "updates payment"
      (let [grant (first (grant-data/get-grants))
            payment (create-payment grant)
            updated-payment-raw
            (payments-data/update-payment
              (assoc payment
                     :paymentstatus-id "waiting"
                     :filename "example.xml")
              example-identity)
            updated-payment (payments-data/get-payment
                              (:id updated-payment-raw))]
        (should (some? payment))
        (should (some? updated-payment))
        (should= "waiting" (:paymentstatus-id updated-payment))
        (should (nil? (:version-closed
                       (payments-data/get-payment (:id updated-payment)))))
        (should (some? (:version-closed
                       (payments-data/get-payment
                         (:id payment) (:version payment))))))))

(run-specs)
