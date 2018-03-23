(ns oph.va.admin-ui.payments.payments-test
  (:require [cljs.test :refer-macros [is deftest]]
            [oph.va.admin-ui.payments.payments
             :refer [multibatch-payable? singlebatch-payable?]]))

(deftest test-multipatch-payable
  (is (multibatch-payable?
        [{:payments
          [{:state 2 :payment-sum 363000}
           {:state 2 :payment-sum 242000}]}
         {:payments
          [{:state 2 :payment-sum 363000}
           {:state 1 :payment-sum 242000}]}]))
  (is (multibatch-payable?
        [{:payments
          [{:state 1 :payment-sum 363000}
           {:state 2 :payment-sum 242000}]}
         {:payments
          [{:state 2 :payment-sum 363000}
           {:state 1 :payment-sum 242000}]}]))
  (is (multibatch-payable?
        [{:payments
          [{:state 1 :payment-sum 363000}]}
         {:payments
          [{:state 1 :payment-sum 363000}
           {:state 1 :payment-sum 242000}]}]))
  (is (not (multibatch-payable?
             [{:payments
               [{:state 2 :payment-sum 363000}
                {:state 2 :payment-sum 242000}]}])))
    (is (not (multibatch-payable?
             [{:payments
               [{:state 2 :payment-sum 363000}
                {:state 2 :payment-sum 242000}]}
              {:payments
               [{:state 2 :payment-sum 363000}
                {:state 2 :payment-sum 242000}]}])))
  (is (not (multibatch-payable? nil)))
  (is (not (multibatch-payable? [{:payments nil}])))
  (is (not (multibatch-payable? [{:payments []}]))))

(deftest test-singlepatch-payable
  (is (singlebatch-payable?
        [{:payments
          [{:state 2 :payment-sum 363000}
           {:state 1 :payment-sum 242000}]}]))
  (is (not (singlebatch-payable?
             [{:payments
               [{:state 2 :payment-sum 363000}
                {:state 2 :payment-sum 242000}]}])))
  (is (not (singlebatch-payable? nil)))
  (is (singlebatch-payable? [{:payments nil}]))
  (is (singlebatch-payable? [{:payments []}])))
