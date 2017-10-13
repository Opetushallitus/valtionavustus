(ns oph.soresu.common.validation
  (:require [clojure.string :as string]))

(defn email-address? [s]
  (and (string? s)
       (<= (count s) 254)
       (some? (re-matches #"(?i)^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$" s))
       (not (re-find #"[^\x00-\x7F]|%0[aA]" s))))

(defn finnish-business-id? [s]
  (if (and (string? s)
           (re-matches #"^[0-9]{7}-[0-9]$" s))
    (let [multipliers          [7 9 10 5 8 4 2]
          check-digit          (read-string (subs s 8 9))
          digits               (mapv (comp read-string str) (subs s 0 7))
          sum                  (apply + (map * multipliers digits))
          remainder            (mod sum 11)
          expected-check-digit (if (= remainder 0) 0 (- 11 remainder))]
      (= check-digit expected-check-digit))
    false))
