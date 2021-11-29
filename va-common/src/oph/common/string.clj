(ns oph.common.string
  (:require [buddy.hashers :as hashers]
            [clojure.string :as string]
            [oph.soresu.common.config :refer [config]]))

(defn trimmed-or-nil [s]
  (when (some? s)
    (let [tr (string/trim s)]
      (when (seq tr)
        tr))))

(defn trim-ws [s]
  (-> s
      string/trim
      (string/replace #"\s" " ")))

(defn- date []
  (.format (java.text.SimpleDateFormat. "yyyyMMdd") (new java.util.Date)))

(defn derive-token-hash [token]
  (subs (hashers/derive (str token (date) (:token-hash-secret config))) 14))
