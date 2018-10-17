(ns oph.va.virkailija.external
  (:require [clojure.tools.logging :as log]
            [schema.core :as s]
            [compojure.api.sweet :as compojure-api]
            [oph.va.virkailija.cas :as cas]
            [oph.va.virkailija.application-data :as application-data]
            [ring.util.http-response :as response]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.schema :as schema]))

(def virkailija-login-url
  (when-not *compile-files*
    (str (-> config :server :virkailija-url) "/api/v2/external/hankkeet/")))

(compojure-api/defroutes routes
  "External API"

  (compojure-api/GET "/hankkeet/" request
    :query-params [{ticket :- s/Str nil}]
    :return [schema/ExternalHanke]
    :summary ""
    (try
      (if (and (some? ticket)
               (cas/validate-service-ticket virkailija-login-url ticket))
        (response/ok (application-data/get-open-applications))
        (response/unauthorized {:error "Unauthorized"}))
      (catch Exception e
        (if (and (.getMessage e) (.contains (.getMessage e) "INVALID_TICKET"))
          (log/warn "Invalid ticket: " (str e))
          (log/error "Error in login ticket handling" e))
        (response/unauthorized {:error "Unauthorized"})))))
