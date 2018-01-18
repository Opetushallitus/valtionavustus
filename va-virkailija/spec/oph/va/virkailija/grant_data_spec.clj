(ns oph.va.virkailija.grant-data-spec
  (:require [speclj.core :refer [describe it should= should-throw]]
            [oph.va.virkailija.grant-data
             :refer [parse-installment-number get-grant-payments-info]]))

(describe "Parse installment number"
          (it "gets installment number"
              (should= 1 (parse-installment-number "660018001")))
          (it "fails on nil value"
              (should-throw (parse-installment-number nil)))
          (it "fails on empty value"
              (should-throw (parse-installment-number "")))
          (it "fails on invalid value"
              (should-throw (parse-installment-number "660018")))
          (it "fails on invalid value"
              (should-throw (parse-installment-number "6600"))))
