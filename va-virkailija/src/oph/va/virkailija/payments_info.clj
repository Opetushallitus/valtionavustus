(ns oph.va.virkailija.payments_info
  (:require
    [ring.util.http-response :refer :all]
    [compojure.api.sweet :as compojure-api]
    [oph.va.hakija.api :as hakija-api]
    [oph.soresu.form.formutil :as formutil]
    [oph.va.virkailija.email :as email]
    [oph.va.virkailija.schema :as virkailija-schema]
    [oph.va.virkailija.hakudata :as hakudata]
    [oph.va.virkailija.db :as virkailija-db]
    [clojure.tools.logging :as log]
    [clojure.string :as str]
    [oph.va.virkailija.decision :as decision]))


(defn send-payments-info [avustushaku-id]
  (log/info "send-payments-info-to-finance" avustushaku-id)
    (email/send-payments-info-to-finance! avustushaku-id)
    (ok {:response "sent e-mail to finance"}))
