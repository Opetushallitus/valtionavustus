(ns oph.va.admin-ui.router-test
  (:require [cljs.test :refer-macros [is deftest]]
            [oph.va.admin-ui.router :as router]))

(deftest test-get-param
  (is (= (router/get-param "search=term" :search) "term"))
  (is (= (router/get-param "search=term&other=param" :search) "term"))
  (is (= (router/get-param "search=term&other=param" :other) "param"))
  (is (nil? (router/get-param nil :search)))
  (is (nil? (router/get-param "search=term&other=param" :notfound))))

(deftest test-query->str
  (is (= (router/query->str {:search "term"}) "search=term"))
  (is (= (router/query->str {:search "term" :other "param" :nmbr 6}) "search=term&other=param&nmbr=6"))
  (is (= (router/query->str nil) "")))
