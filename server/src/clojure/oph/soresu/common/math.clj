(ns oph.soresu.common.math
  (:require [clojure.string :as string]))

(defn parse-integer [value]
  (try
    (Integer/parseInt (-> value str string/trim))
    (catch NumberFormatException _
      0)))

(defn represents-integer? [value]
  (let [as-str (str value)
        parsed (-> as-str parse-integer str)]
    (= parsed as-str)))

(defn- normalize-decimal-str [^String value]
  (string/replace value \, \.))

(defn- do-parse-decimal [^String value]
  (try
    (Double/parseDouble value)
    (catch NumberFormatException _
      0.0)))

(defn parse-decimal [value]
  (let [as-str    (str value)
        as-double (do-parse-decimal (normalize-decimal-str as-str))
        as-int    (int as-double)]
    (if (== as-double as-int)
      as-int
      as-double)))

(defn represents-decimal? [value]
  (let [as-str (str value)]
    (if (= (string/trim as-str) as-str)
      (let [normalized       (normalize-decimal-str as-str)
            dot-zero-trimmed (string/replace-first normalized #"\.0+$" "")
            parsed           (-> normalized parse-decimal str)]
        (= parsed dot-zero-trimmed))
      false)))
