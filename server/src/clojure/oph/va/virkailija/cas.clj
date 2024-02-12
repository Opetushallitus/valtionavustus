(ns oph.va.virkailija.cas
  (:require [clojure.data.json :as json]
            [org.httpkit.client :as hk-client]
            [oph.common.caller-id :refer [caller-id]]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.http :as http])
  (:import [fi.vm.sade.utils.cas CasAuthenticatingClient CasClient CasParams]
           [org.http4s.client Client]))

(def ^:private cas-client
  (when-not *compile-files*
    (delay (CasClient. (str (-> config :opintopolku :url) "/cas") @http/blaze-client caller-id))))

(defn make-cas-authenticating-client
  ([^String service-url]
   (let [username (get-in config [:opintopolku :cas-service-username])
         password (get-in config [:opintopolku :cas-service-password])]
     (make-cas-authenticating-client service-url username password)))

  ([^String service-url
    ^String username
    ^String password]
   (make-cas-authenticating-client service-url username password @http/blaze-client))

  ([^String service-url
    ^String username
    ^String password
    ^Client service-client]
   {:pre [(seq service-url) (seq username) (seq password)]}
   (CasAuthenticatingClient/apply @cas-client (CasParams/apply service-url username password) service-client caller-id "JSESSIONID")))

(defn try-n-times [f n]
  (try
    (f)
    (catch Throwable t
      (if (pos? n)
        (try-n-times f (dec n))
        (throw t)))))

(defmacro try3 [& body]
  `(try-n-times (fn [] ~@body) 3))

(defn validateServiceTicketWithVirkailijaUsername [^String service ^String cas-ticket]
  (let [casRes (hk-client/get (str (-> config :opintopolku :url) "/cas/serviceValidate")
                              {:query-params {:ticket cas-ticket
                                              :service service
                                              :format "json"}
                               :headers {"caller-id" caller-id}})
        res-body (json/read-str (:body @casRes) :key-fn keyword)]
    (-> res-body :serviceResponse :authenticationSuccess :user)))

(defn validate-service-ticket [^String service ^String cas-ticket]
  (try3 (validateServiceTicketWithVirkailijaUsername service cas-ticket)))