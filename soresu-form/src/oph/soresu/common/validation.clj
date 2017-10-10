(ns oph.soresu.common.validation
  (:require [clojure.string :as string]))

(defn email-address? [s]
  (and (string? s)
       (<= (count s) 254)
       (some? (re-matches #"(?i)^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$" s))
       (not (re-find #"[^\x00-\x7F]|%0[aA]" s))))
