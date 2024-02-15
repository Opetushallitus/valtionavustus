(ns oph.va.virkailija.http
  (:require [cheshire.core :as cheshire]
            [oph.common.caller-id :as caller-id]
            [oph.soresu.common.config :refer [config]]
            [org.httpkit.client :as hk-client])
  (:import [oph.va.virkailija.http BlazeClients JavaClient ResponseException]
           [scala.runtime AbstractFunction1]))

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

(defn get-tgt []
  (let [opintopolku-url (-> config :opintopolku :url)
        username (get-in config [:opintopolku :cas-service-username])
        password (get-in config [:opintopolku :cas-service-password])
        tgt-response @(hk-client/post (str opintopolku-url "/cas/v1/tickets") {:form-params {:username username :password password}})
        location-header (-> tgt-response :headers :location)
        tgt (re-find (re-pattern "TGT-.*") location-header)]
    tgt))

(defn get-st [tgt service-url]
  (let [opintopolku-url (-> config :opintopolku :url)
        service (str service-url "/j_spring_cas_security_check")
        st-res @(hk-client/post (str opintopolku-url "/cas/v1/tickets/" tgt) {:query-params {:service service} :headers {"caller-id" caller-id/caller-id
                                                                                                                         "CSRF" caller-id/caller-id}})
        st (slurp (:body st-res))]
    st))