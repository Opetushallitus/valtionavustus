(ns oph.va.admin-ui.payments.payments-test
  (:require [cljs.test :refer-macros [is deftest]]
            [oph.va.admin-ui.payments.payments
             :refer [multibatch-payable?]]))

(deftest test-multipatch-payable
  (is (multibatch-payable?
        [{:payments
          [{:paymentstatus-id "sent" :payment-sum 363000}
           {:paymentstatus-id "sent" :payment-sum 242000}]}
         {:payments
          [{:paymentstatus-id "sent" :payment-sum 363000}
           {:paymentstatus-id "waiting" :payment-sum 242000}]}]))
  (is (multibatch-payable?
        [{:payments
          [{:paymentstatus-id "waiting" :payment-sum 363000}
           {:paymentstatus-id "sent" :payment-sum 242000}]}
         {:payments
          [{:paymentstatus-id "sent" :payment-sum 363000}
           {:paymentstatus-id "waiting" :payment-sum 242000}]}]))
  (is (multibatch-payable?
        [{:payments
          [{:paymentstatus-id "waiting" :payment-sum 363000}]}
         {:payments
          [{:paymentstatus-id "waiting" :payment-sum 363000}
           {:paymentstatus-id "waiting" :payment-sum 242000}]}]))
  (is (not (multibatch-payable?
             [{:payments
               [{:paymentstatus-id "sent" :payment-sum 363000}
                {:paymentstatus-id "sent" :payment-sum 242000}]}])))
    (is (not (multibatch-payable?
             [{:payments
               [{:paymentstatus-id "sent" :payment-sum 363000}
                {:paymentstatus-id "sent" :payment-sum 242000}]}
              {:payments
               [{:paymentstatus-id "sent" :payment-sum 363000}
                {:paymentstatus-id "sent" :payment-sum 242000}]}])))
  (is (not (multibatch-payable? nil)))
  (is (not (multibatch-payable? [{:payments nil}])))
  (is (not (multibatch-payable? [{:payments []}]))))
