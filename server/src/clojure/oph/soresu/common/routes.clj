(ns oph.soresu.common.routes
  (:require [ring.util.http-response :refer :all]
            [ring.util.request :as req]
            [ring.util.response :as resp]
            [schema.utils :as schema]
            [compojure.api.exception :as compojure-ex]
            [clojure.tools.logging :as log]))

(defn return-from-classpath [filename-under-public contenttype]
  (-> (resp/resource-response filename-under-public {:root "public"})
      (content-type contenttype)))

(defn return-html [filename]
  (-> (return-from-classpath filename "text/html")
      (charset "utf-8")))

(defn stringify-error [^Exception ex data]
  (cond
    (schema/error? data)
    (compojure-ex/stringify-error (schema/error-val data))
    (some? (.getCause ex))
    (str (.getCause ex))
    :else
    (compojure-ex/stringify-error data)))

(defn exception-handler [^Exception ex data request]
  (log/error ex "Unknown 500 Internal Server Error" " Method" (:request-method request) " Url" (req/request-url request))
  (internal-server-error {:type "unknown-exception"
                          :class (.getName (.getClass ex))}))

(defn compojure-error-handler [^Exception ex data request]
  (let [error-type (:type data)
        error-str  (stringify-error ex data)
        error-desc (str error-type " Method " (:request-method request) " Url " (req/request-url request))]
    (if (some #{error-type} [::compojure-ex/request-parsing ::compojure-ex/request-validation])
      (do
        (log/warn ex "400 Bad Request" error-desc)
        (bad-request {:errors error-str}))
      (do
        (log/error ex "500 Internal Server Error" error-desc)
        (internal-server-error {:errors error-str})))))
