(ns oph.va.virkailija.external
  (:require [clojure.tools.logging :as log]
            [compojure.api.sweet :as compojure-api]
            [oph.soresu.common.config :refer [config environment without-authentication?]]
            [oph.va.virkailija.application-data :as application-data]
            [oph.va.virkailija.cas :as cas]
            [oph.va.virkailija.external-data :as external-data]
            [oph.va.virkailija.schema :as schema]
            [ring.util.http-response :as response]
            [schema.core :as s]))

(def virkailija-login-url
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
               (cas/validate-service-ticket virkailija-login-url ticket)))
        (response/ok (external-data/get-grants-for-year year))
        (response/unauthorized {:error "Unauthorized"}))
      (catch Exception e
        (if (and (.getMessage e) (.contains (.getMessage e) "INVALID_TICKET"))
          (log/warn "Invalid ticket: " (str e))
          (log/error "Error in login ticket handling" e))
        (response/unauthorized {:error "Unauthorized"}))))

  (compojure-api/GET "/avustushaku/:avustushaku-id/hakemukset" request
    :query-params [{ticket :- s/Str nil}]
    :path-params [avustushaku-id :- Long]
    :return [schema/ExternalApplication]
    :summary ""
    (try
      (if (or (without-authentication?) (and (some? ticket)
               (cas/validate-service-ticket virkailija-login-url ticket)))
        (response/ok (external-data/get-applications-by-grant-id avustushaku-id))
        (response/unauthorized {:error "Unauthorized"}))
      (catch Exception e
        (if (and (.getMessage e) (.contains (.getMessage e) "INVALID_TICKET"))
          (log/warn "Invalid ticket: " (str e))
          (log/error "Error in login ticket handling" e))
        (response/unauthorized {:error "Unauthorized"}))))

  (compojure-api/GET "/hankkeet/" request
    :query-params [{ticket :- s/Str nil}]
    :return [schema/ExternalHanke]
    :summary ""
    (try
      (if (or (without-authentication?) (and (some? ticket)
               (cas/validate-service-ticket virkailija-login-url ticket)))
        (response/ok (application-data/get-open-applications))
        (response/unauthorized {:error "Unauthorized"}))
      (catch Exception e
        (if (and (.getMessage e) (.contains (.getMessage e) "INVALID_TICKET"))
          (log/warn "Invalid ticket: " (str e))
          (log/error "Error in login ticket handling" e))
        (response/unauthorized {:error "Unauthorized"}))))

  (when (or (= environment "dev") (= environment "test"))
    (s/defschema ExternalId
      "Hankkeen id tunnisteen perusteella"
      {:id s/Int})

    (compojure-api/GET "/hakemus/id/:token" request
      :path-params [token :- s/Str]
      :return ExternalId
      :summary ""
      (response/ok (application-data/get-application-id-by-token token)))))
