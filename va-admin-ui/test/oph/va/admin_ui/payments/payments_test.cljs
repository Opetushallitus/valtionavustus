(ns oph.va.admin-ui.payments.payments-test
  (:require [cljs.test :refer-macros [is deftest]]
            [oph.va.admin-ui.payments.payments
             :refer [multibatch-payable?]]))

(deftest test-multipatch-payable
  (is (multibatch-payable?
        {:payments
         [{:state 2 :payment-sum 363000}
          {:state 1 :payment-sum 242000}]}))
  (is (not (multibatch-payable?
             {:payments
              [{:state 2 :payment-sum 363000}
               {:state 2 :payment-sum 242000}]})))
  (is (not (multibatch-payable? nil)))
  (is (not (multibatch-payable? {})))
  (is (not (multibatch-payable? {:payments nil})))
  (is (not (multibatch-payable? {:payments []}))))
