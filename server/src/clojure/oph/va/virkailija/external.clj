(ns oph.va.virkailija.external
  (:require [clojure.tools.logging :as log]
            [compojure.api.sweet :as compojure-api]
            [oph.soresu.common.config :refer [config without-authentication?]]
            [oph.va.virkailija.cas :as cas]
            [oph.va.virkailija.external-data :as external-data]
            [oph.va.virkailija.schema :as schema]
            [ring.util.http-response :as response]
            [schema.core :as s]))

(def external-api-service-url
  (when-not *compile-files*
    (str (-> config :server :virkailija-url) "/api/v2/external/hankkeet/")))

(compojure-api/defroutes routes
  "External API"

  (compojure-api/GET "/avustushaut/" request
    :query-params [{ticket :- s/Str nil}, {year :- s/Int nil}]
    :return [schema/ExternalGrant]
    :summary ""
    (try
      (if (or (without-authentication?) (and (some? ticket)
               (cas/validate-service-ticket external-api-service-url ticket)))
        (response/ok (external-data/get-grants-for-year year))
        (response/unauthorized {:error "Unauthorized"}))
      (catch Exception e
        (cond
          (and (.getMessage e) (.contains (.getMessage e) "INVALID_TICKET")) (log/warn "Invalid ticket: " (str e))
          (and (.getMessage e) (.contains (.getMessage e) "INVALID_SERVICE")) (log/warn "Invalid service in ticket: " (str e))
          :else (log/error "Error in login ticket handling" e))
        (response/unauthorized {:error "Unauthorized"}))))

  (compojure-api/GET "/avustushaku/:avustushaku-id/hakemukset" request
    :query-params [{ticket :- s/Str nil}]
    :path-params [avustushaku-id :- Long]
    :return [schema/ExternalApplication]
    :summary ""
    (try
      (if (or (without-authentication?) (and (some? ticket)
               (cas/validate-service-ticket external-api-service-url ticket)))
        (response/ok (external-data/get-applications-by-grant-id avustushaku-id))
        (response/unauthorized {:error "Unauthorized"}))
      (catch Exception e
        (cond
          (and (.getMessage e) (.contains (.getMessage e) "INVALID_TICKET")) (log/warn "Invalid ticket: " (str e))
          (and (.getMessage e) (.contains (.getMessage e) "INVALID_SERVICE")) (log/warn "Invalid service in ticket: " (str e))
          :else (log/error "Error in login ticket handling" e))
        (response/unauthorized {:error "Unauthorized"}))))

  (compojure-api/GET "/hankkeet/" request
    :query-params []
    :summary "This endpoint exists for authentication purposes only"
    :description "Other external API endpoints use this endpoint in the authentication ticket"
    (response/not-found "unused endpoint")))
