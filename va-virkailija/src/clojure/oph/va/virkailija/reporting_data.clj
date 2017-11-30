(ns oph.va.virkailija.reporting-data
  (:require
   [oph.soresu.common.db :refer [exec]]
   [oph.va.virkailija.db.queries :as queries]))

(defn get-application-count-by-year []
  {:applications
   (mapv
    #(update % :year int)
    (exec :form-db queries/get-application-count-by-year {}))})

