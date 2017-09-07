(ns ruuvi-clj.url-decoder-test
  (:require [clojure.test :refer :all]
            [ruuvi-clj.url-decoder :refer :all]))

(defn abs
  [n]
  (if (neg? n) (- n) n))

(defn close?
  ([v1 v2]
  (close? v1 v2 0.1))
  ([v1 v2 d]
  (< (abs (- v2 v1)) d)))

(deftest test-decoding-to-map
  (testing "Decoding url encoded data to map."
    (let [values (decode-to-map "BHAVAMFci")]
      (is (close? (:humidity values) 56.0))
      (is (close? (:temperature values) 21.0))
      (is (close? (:pressure values) 995.0))
      (is (= (:identifier values) "i")))))
