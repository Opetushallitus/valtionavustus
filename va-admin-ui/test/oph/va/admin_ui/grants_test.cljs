(ns oph.va.admin-ui.grants-test
  (:require [cljs.test :refer-macros [is are deftest testing use-fixtures]]
            [cljs-time.core :as t]
            [oph.va.admin-ui.grants :as grants]))

(deftest test-remove-old
  (let [grants [{:loppuselvitysdate (t/now) :status "resolved"}
                {:loppuselvitysdate (t/minus (t/now) (t/months 13))
                 :status "resolved"}]]
    (is (= (count (grants/remove-old grants)) 1))))

