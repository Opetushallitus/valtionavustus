(ns oph.va.virkailija.http
  (:require [oph.soresu.common.config :refer [config]]
            [cheshire.core :as cheshire])
  (:import [scala.runtime AbstractFunction1]
           [org.http4s.client Client]
           [oph.va.virkailija.http BlazeClients JavaClient ResponseException]))

(def ^:private accept-header-json {"Accept" "application/json"})

(def blaze-client
  (when-not *compile-files*
    (delay (let [num-threads (or (-> config :server :threads) 16)]
             (BlazeClients/newPooledClient (* 2 num-threads) num-threads)))))

(defprotocol HttpClient
  (client-get-json [http-client url])
  (client-pget-json [http-client urls]))

(defn- do-run-and-wait-first [responses]
  (if (seq responses)
    @(first responses)))

(defn- either-parse-string-or-throwable [either]
  (if (.isRight either)
    (-> either .b (cheshire/parse-string true))
    (.a either)))

(defn make-http-client
  ([]
   (make-http-client @blaze-client))

  ([http-client]
   (let [java-client (JavaClient/newClient http-client)]
     (reify HttpClient
       (client-get-json [_ url]
         (let [body-str (-> java-client
                            (.getAsString url accept-header-json)
                            .run)]
           (cheshire/parse-string body-str true)))

       (client-pget-json [_ urls]
         (let [responses (map (fn [url]
                                (let [p  (promise)
                                      cb (proxy [AbstractFunction1] []
                                           (apply [result]
                                             (deliver p result)
                                             nil))]
                                  (-> java-client
                                      (.getAsString url accept-header-json)
                                      (.runAsync cb))
                                  p))
                              urls)]

           ;; Play nice with CAS: Realize the first request and wait for
           ;; its response. At that point, the HTTP client has
           ;; established a browser session with CAS, which can be
           ;; utilized for the rest of the requests. If we do not wait,
           ;; all the requests race to establish the browser session,
           ;; creating unnecessary traffic to CAS.
           (do-run-and-wait-first responses)

           ;; Realize the rest of the requests, but do not wait for the
           ;; responses.
           (dorun responses)

           ;; Return lazy-seq of waited responses. This allows the
           ;; responses to complete while the caller might do something
           ;; else.
           (map #(-> @% either-parse-string-or-throwable) responses)))))))

(defn response-exception? [status-code r]
  (and (instance? ResponseException r)
       (= (.statusCode r) status-code)))
