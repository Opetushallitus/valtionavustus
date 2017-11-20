(ns oph.va.virkailija.payments-data
  (:require
   [oph.soresu.common.db :refer [exec]]
   [oph.va.hakija.api :refer [convert-to-dash-keys]]
   [oph.va.virkailija.db.queries :as queries]))

(defn get-payment [id]
  (convert-to-dash-keys
   (first
    (exec :form-db queries/get-payment {:id id}))))

(defn close-version [id version]
  (exec :form-db queries/payment-close-version
        {:id id :version version}))
