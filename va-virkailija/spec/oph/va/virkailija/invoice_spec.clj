(ns oph.va.virkailija.invoice-spec
  (:require [speclj.core :refer [describe it should=]]
            [clj-time.format :as f]
            [oph.va.virkailija.invoice :as invoice]))

(def payment {:acceptor-email "acceptor@example.com"
              :created-at (f/parse "2017-12-20T10:24:59.750Z")
              :application-id 6114
              :currency "EUR"
              :document-type "XA"
              :due-date (f/parse "2017-12-20T10:24:59.750Z")
              :inspector-email "inspector@example.com"
              :invoice-date (f/parse "2017-12-20T10:24:59.750Z")
              :organisation "6600"
              :receipt-date (f/parse "2017-12-20T10:24:59.750Z")
              :state 0
              :transaction-account "5000"
              :partner ""
              :installment-number 13})

(def application {:project-name "Example project"
                  :register-number "1/234/2017"
                  :organization-name "Some organisation"
                  :grant-id 87
                  :budget-total 14445
                  :language "fi"
                  :id 6114
                  :budget-oph-share 13000
                  :version 432
                  :created-at (f/parse "2017-05-19T10:21:23.138168000-00:00")})

(def answers '({:key "key1" :value "somevalue" :fieldType "textArea"}
               {:key "email" :value "test@user.com" :fieldType "emailField"}))

(describe "Get answer value"
          (it "gets answer value"
              (should= "test@user.com"
                       (invoice/get-answer-value answers "email")))
          (it "returns nil if key not found"
              (should= nil (invoice/get-answer-value answers "non-existing")))
          (it "returns default if key not found"
              (should= "default"
                       (invoice/get-answer-value
                         answers "non-existing" "default")))
          (it "returns value if found altough default was given"
              (should= "somevalue"
                       (invoice/get-answer-value answers "key1" "default"))))

(describe "Get installment number of payment"
          (it "calculates installment number"
              (should= "660017013" (invoice/get-installment payment)))
          (it "returns nil if any needed value is nil"
              (should= nil (invoice/get-installment nil))
              (should= nil (invoice/get-installment {:some "Value"}))))

