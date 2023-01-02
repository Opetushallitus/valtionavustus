(ns oph.soresu.common.routes
  (:require [ring.util.http-response :refer :all]
            [ring.util.request :as req]
            [ring.util.response :as resp]
            [schema.utils :as schema]
            [compojure.api.exception :as compojure-ex]
            [clojure.tools.logging :as log]
            [clojure.java.io :as java-io]))

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

(defn describe-error [^Exception ex message request]
  {:request-method (:request-method request)
   :request-url    (req/request-url request)
   :message        message
   :exception      ex})

(defn exception-handler [^Exception ex data request]
  (log/error (describe-error ex (stringify-error ex data) request))
  (internal-server-error {:type "unknown-exception"
                          :class (.getName (.getClass ex))}))

(defn compojure-error-handler [^Exception ex data request]
  (let [error-type (:type data)
        error-str  (stringify-error ex data)
        error-desc (describe-error ex (format "%s error: %s" error-type error-str) request)]
    (if (some #{error-type} [::compojure-ex/request-parsing ::compojure-ex/request-validation])
      (do
        (log/warn (dissoc error-desc :exception))
        (bad-request {:errors error-str}))
      (do
        (log/error error-desc)
        (internal-server-error {:errors error-str})))))
