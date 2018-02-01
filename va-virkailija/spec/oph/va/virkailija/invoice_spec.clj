(ns oph.va.virkailija.invoice-spec
  (:require [speclj.core :refer [describe it should=]]
            [clj-time.format :as f]
            [clojure.data.xml :as xml]
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

(def response-tags [:VA-invoice
                    [:Header
                     [:Pitkaviite "1/234/2018"]
                     [:Maksupvm "2018-01-25"]]])

(def response-xml (xml/sexp-as-element response-tags))

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

(describe "Get response XML element content"
          (it "gets content of Pitkaviite"
              (should=
                '("1/234/2018")
                (invoice/get-content response-xml
                                     [:VA-invoice :Header :Pitkaviite])))
          (it "gets content of Maksupvm"
              (should=
                '("2018-01-25")
                (invoice/get-content response-xml
                                     [:VA-invoice :Header :Maksupvm]))))

(describe "Handle response XML get value errors"
          (it "returns nil if last not found"
              (should=
                nil
                (invoice/get-content response-xml
                                     [:VA-invoice :Header :Not-Found])))
          (it "returns nil if first tag not found"
              (should=
                nil
                (invoice/get-content response-xml
                                     [:Not-Found :Header :Pitkaviite])))
          (it "returns nil if xml is nil"
              (should= nil (invoice/get-content nil [:Not-Valid :Child])))
          (it "returns root content if keys are empty"
              (should=
                :VA-invoice
                (:tag (first (invoice/get-content response-xml [])))))
          (it "returns root content if keys are nil"
              (should=
                :VA-invoice
                (:tag (first (invoice/get-content response-xml nil))))))

(describe "Parse installment number"
          (it "gets installment number"
              (should= 1 (invoice/parse-installment-number "660018001")))
          (it "fails on nil value"
              (should-throw (invoice/parse-installment-number nil)))
          (it "fails on empty value"
              (should-throw (invoice/parse-installment-number "")))
          (it "fails on invalid value"
              (should-throw (invoice/parse-installment-number "660018")))
          (it "fails on invalid value"
              (should-throw (invoice/parse-installment-number "6600"))))
