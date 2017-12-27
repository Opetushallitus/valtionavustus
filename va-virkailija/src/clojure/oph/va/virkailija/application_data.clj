(ns oph.va.virkailija.application-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.hakija.api.queries :as hakija-queries]
            [oph.va.hakija.api :refer [convert-to-dash-keys]]
            [clj-time.core :as t]
            [clj-time.coerce :as c]
            [oph.va.hakija.grant-data :as grant-data]
            [oph.va.virkailija.db.queries :as virkailija-queries])
  (:import (oph.va.jdbc.enums)))

(defn get-application [id]
  (convert-to-dash-keys
   (first
    (exec :form-db hakija-queries/get-application {:application_id id}))))

(defn get-application-with-evaluation-and-answers [id]
  (convert-to-dash-keys
   (first
    (exec :form-db hakija-queries/get-application-with-evaluation-and-answers
          {:application_id id}))))

(defn get-payments-history [id]
  (mapv
   convert-to-dash-keys
   (exec :form-db virkailija-queries/get-payment-history
         {:application_id id})))
