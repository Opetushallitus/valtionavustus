(ns oph.va.admin-ui.payments.payments-core-test
  (:require [cljs.test :refer-macros [is are deftest testing use-fixtures]]
            [oph.va.admin-ui.payments.payments-core :refer [paid-full?]]))

(deftest test-paid-full
  (is (paid-full?
        {:budget-granted 200000
         :payments [{:payment-sum 100000}
                    {:payment-sum 100000}]}))
  (is (not
        (paid-full? {:budget-granted 150000
                     :payments [{:payment-sum 50000}]}))))
