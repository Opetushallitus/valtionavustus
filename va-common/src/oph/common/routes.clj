(ns oph.common.routes
  (:require [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [schema.utils :as schema]
            [compojure.api.exception :as compojure-ex]
            [clojure.tools.logging :as log]
            [clojure.java.io :as java-io]))

(defn return-from-classpath [filename-under-public contenttype]
  (-> (resp/resource-response filename-under-public {:root "public"})
        (content-type contenttype)
        (charset  "utf-8")))

(defn return-html [filename]
  (return-from-classpath filename "text/html"))

(defn get-translations []
  (return-from-classpath "translations.json" "application/json"))

(defn exception-handler [^Exception ex data request]
  (log/error ex ex)
  (internal-server-error {:type "unknown-exception"
                        :class (.getName (.getClass ex))}))

(defn stringify-error [^Exception ex data]
  (cond
    (schema/error? data)
      (compojure-ex/stringify-error (schema/error-val data))
    (some? (.getCause ex))
      (str (.getCause ex))
    :else
    (compojure-ex/stringify-error data)))

(defn compojure-error-handler [^Exception ex data request]
  (let [error-type (:type data)
        error-str (stringify-error ex data)
        log-str (format "%s error: %s" error-type error-str)]
    (if (some #{error-type} [::compojure-ex/request-parsing ::compojure-ex/request-validation])
      (do
        (log/warn log-str)
        (bad-request {:errors error-str}))
      (do
        (log/error log-str)
        (internal-server-error {:errors error-str})))))
