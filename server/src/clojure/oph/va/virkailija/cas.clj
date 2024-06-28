(ns oph.va.virkailija.cas
  (:require [clojure.data.json :as json]
            [oph.common.caller-id :as caller-id]
            [oph.soresu.common.config :refer [config]]
            [org.httpkit.client :as hk-client]
            [clojure.tools.logging :as log]
            [clojure.xml :as xml]))

(defn try-n-times [f n]
  (try
    (f)
    (catch Throwable t
      (if (pos? n)
        (try-n-times f (dec n))
        (throw t)))))

(defmacro try3 [& body]
  `(try-n-times (fn [] ~@body) 3))

(defn get-tgt []
  (let [opintopolku-url (-> config :opintopolku :url)
        username (get-in config [:opintopolku :cas-service-username])
        password (get-in config [:opintopolku :cas-service-password])
        tgt-response @(hk-client/post (str opintopolku-url "/cas/v1/tickets") {:form-params {:username username :password password}})
        location-header (-> tgt-response :headers :location)]
    (when (clojure.string/blank? location-header)
      (throw (Exception. (str "Unexpected CAS " (:status tgt-response) " response when getting TGT: " (:body tgt-response)))))
    (re-find (re-pattern "TGT-.*") location-header)))

(defn get-st [tgt service-url]
  (let [opintopolku-url (-> config :opintopolku :url)
        service (str service-url "/j_spring_cas_security_check")
        st-res @(hk-client/post (str opintopolku-url "/cas/v1/tickets/" tgt) {:query-params {:service service} :headers {"caller-id" caller-id/caller-id
                                                                                                                         "CSRF" caller-id/caller-id}})
        st (slurp (:body st-res))]
    st))

(defn validateServiceTicketWithVirkailijaUsername [^String service ^String cas-ticket]
  (let [url (str (-> config :opintopolku :url) "/cas/serviceValidate")
        casRes (hk-client/get url {:query-params {:ticket cas-ticket
                                                  :service service
                                                  :format "json"}
                                   :headers {"caller-id" caller-id/caller-id}})
        res-body (json/read-str (:body @casRes) :key-fn keyword)]
    (-> res-body :serviceResponse :authenticationSuccess :user)))

(defn- parse-ticket-inner [logout-request]
  (let [parsed (xml/parse (java.io.ByteArrayInputStream. (.getBytes logout-request)))]
    (->> parsed
         :content
         (filter (fn [e] (= (:tag e) :samlp:SessionIndex)))
         first
         :content
         first)))

(defn parse-ticket [logout-request]
  (let [parsed-ticket (parse-ticket-inner logout-request)]
    (if (nil? parsed-ticket)
      (log/error "Could not parse ticket from CAS request: " logout-request)
      parsed-ticket)))

(defn validate-service-ticket [^String service ^String cas-ticket]
  (try3 (validateServiceTicketWithVirkailijaUsername service cas-ticket)))