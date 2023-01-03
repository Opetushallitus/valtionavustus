(ns oph.va.virkailija.fake-http
  (:require [cheshire.core :as json]
            [oph.va.virkailija.http :as http])
  (:import [oph.va.virkailija.http HttpClient]))

(defn make-fake-http-client [responses]
  (let [resps (reduce-kv (fn [acc k v] (assoc acc k (json/generate-string v))) {} responses)]
    (reify HttpClient
      (client-get-json [_ url]
        (if-let [body-str (get resps url)]
          (json/parse-string body-str true)
          (throw (IllegalArgumentException. (str "No fake response for client-get-json " url)))))

      (client-pget-json [this urls]
        (map #(http/client-get-json this %) urls)))))

(defmacro with-fake-http-client [client-var responses & body]
  `(with-redefs [~client-var (delay (make-fake-http-client ~responses))]
     ~@body))
