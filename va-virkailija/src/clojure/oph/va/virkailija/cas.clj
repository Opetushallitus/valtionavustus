(ns oph.va.virkailija.cas
  (:require [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.http :as http])
  (:import [org.http4s.client Client]
           [fi.vm.sade.utils.cas CasClient]
           [oph.va.virkailija.http BlazeClients CasClients JavaClient]))

(def ^:private cas-client
  (when-not *compile-files*
    (delay (CasClient. (-> config :opintopolku :url) @http/blaze-client))))

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
   (CasClients/newCasAuthenticatingClient service-url
                                          username
                                          password
                                          @cas-client
                                          service-client)))

(defn validate-service-ticket [^String virkailija-login-url ^String cas-ticket]
  (-> @cas-client
      (.validateServiceTicket virkailija-login-url cas-ticket)
      .run))
