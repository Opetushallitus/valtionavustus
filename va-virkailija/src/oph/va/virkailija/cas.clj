(ns oph.va.virkailija.cas
  (:require [oph.soresu.common.config :refer [config]]
            [clojure.tools.logging :as log])
  (:import [fi.vm.sade.utils.cas CasClient]
           [oph.va.virkailija.cas BlazeClients]))

(def ^{:private true} http-client (BlazeClients/newSimpleClient))
(def ^{:private true} cas-client (CasClient. (-> config :opintopolku :url) http-client))

(defn validate-service-ticket [^String virkailija-login-url ^String cas-ticket]
  (-> cas-client
      (.validateServiceTicket virkailija-login-url cas-ticket)
      .run))
