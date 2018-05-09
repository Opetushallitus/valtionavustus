(ns oph.va.admin-ui.utils-test
  (:require [cljs.test :refer-macros [is are deftest testing use-fixtures]]
            [oph.va.admin-ui.utils :as utils]))

(deftest test-fill
  (is (= (utils/fill ["str1" "str2"] 4 "str-x")
         ["str1" "str2" "str-x" "str-x"]))
  (is (= (count (utils/fill '(2 3) 5)) 5))
  (is (= (utils/fill [2] 6) [2 "" "" "" "" ""]))
  (is (= (utils/fill [] 0) []))
  (is (= (utils/fill [2 5] 0) [2 5]))
  (is (= (count (utils/fill nil 0)) 0)))

(deftest test-get-answer-value
  (is (= (utils/get-answer-value nil "some-key") nil))
  (is (= (utils/get-answer-value
           [{:key "key1" :value "value1"}
            {:key "key2" :value "value2"}]
           "some-key")
         nil))
  (is (= (utils/get-answer-value
           [{:key "key1" :value "value1"}
            {:key "key2" :value "value2"}
            {:key "some-key" :value "some-value"}]
           "some-key") "some-value")))
