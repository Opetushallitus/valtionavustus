(ns oph.common.string
  (:require [clojure.string :as string]))

(defn trimmed-or-nil [s]
  (when (some? s)
    (let [tr (string/trim s)]
      (when (seq tr)
        tr))))

(defn trim-ws [s]
  (-> s
      string/trim
      (string/replace #"\s" " ")))
