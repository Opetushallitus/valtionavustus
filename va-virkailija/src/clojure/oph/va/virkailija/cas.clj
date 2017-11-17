(ns oph.va.virkailija.cas
  (:require [oph.soresu.common.config :refer [config]]
            [clojure.tools.logging :as log])
  (:import [fi.vm.sade.utils.cas CasClient]
           [oph.va.virkailija.cas BlazeClients]))

(def ^:private http-client
  (when-not *compile-files*
    (BlazeClients/newSimpleClient)))

(def ^:private cas-client
  (when-not *compile-files*
    (CasClient. (-> config :opintopolku :url) http-client)))

(defn validate-service-ticket [^String virkailija-login-url ^String cas-ticket]
  (-> cas-client
      (.validateServiceTicket virkailija-login-url cas-ticket)
      .run))
