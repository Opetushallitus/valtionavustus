(ns oph.common.routes
  (:require [ring.util.http-response :refer :all]
            [ring.util.response :as resp]
            [ring.swagger.middleware :as swagger]
            [clojure.tools.logging :as log]))

(defn return-html [filename]
  (-> (resp/resource-response filename {:root "public"})
      (content-type "text/html")
      (charset  "utf-8")))

(defn exception-handler [^Exception e]
  (log/warn e e)
  (internal-server-error {:type "unknown-exception"
                          :class (.getName (.getClass e))}))

(defn validation-error-handler [{:keys [error]}]
  (let [error-str (swagger/stringify-error error)]
    (log/warn (format "Request validation error: %s" (print-str error-str)))
    (bad-request {:errors error-str})))
