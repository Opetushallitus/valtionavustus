(ns oph.va.virkailija.cas
  (:require [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.http :as http]
            [oph.common.caller-id :refer [caller-id]])
  (:import [org.http4s.client Client]
           [fi.vm.sade.utils.cas CasClient]
           [oph.va.virkailija.http BlazeClients CasClients JavaClient]))

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
   (CasClients/newCasAuthenticatingClient service-url
                                          username
                                          password
                                          @cas-client
                                          service-client
                                          caller-id)))

(defn validate-service-ticket [^String virkailija-login-url ^String cas-ticket]
  (-> @cas-client
      (.validateServiceTicketWithVirkailijaUsername virkailija-login-url cas-ticket)
      .run))
