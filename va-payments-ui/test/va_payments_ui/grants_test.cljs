(ns va-payments-ui.grants-test
  (:require [cljs.test :refer-macros [is are deftest testing use-fixtures]]
            [cljs-time.core :as t]
            [va-payments-ui.grants :as grants]))

(deftest test-remove-old
  (let [grants [{:loppuselvitysdate (t/now) :status "resolved"}
                {:loppuselvitysdate (t/minus (t/now) (t/months 13))
                 :status "resolved"}]]
    (is (= (count (grants/remove-old grants)) 1))))

