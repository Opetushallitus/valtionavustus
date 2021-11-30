(ns oph.common.string
  (:require [buddy.hashers :as hashers]
            [clojure.string :as string]
            [oph.common.datetime :as datetime]
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

(defn- get-hashed-str [token]
  (str token (datetime/date-string (datetime/now))))

(defn derive-token-hash [token]
  (subs (hashers/derive (get-hashed-str token) {:salt (:token-hash-secret config) :alg :bcrypt+sha512}) 14))

(defn verify-token-hash [token hash]
  (hashers/verify (get-hashed-str token) (str "bcrypt+sha512$" hash) {:salt (:token-hash-secret config)}))
