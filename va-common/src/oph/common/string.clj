(ns oph.common.string
  (:require [clojure.string :as string]))

(defn trim-ws [str]
  (-> str
      string/trim
      (string/replace #"\s" " ")))
