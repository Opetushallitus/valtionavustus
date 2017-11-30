(ns oph.va.virkailija.reporting-data
  (:require
   [oph.soresu.common.db :refer [exec]]
   [oph.va.virkailija.db.queries :as queries])
  (:import (oph.va.jdbc.enums HakuStatus)))

(defn year-to-int-all-v [c]
  (mapv #(update % :year int) c))

(defn get-application-count-by-year []
  (year-to-int-all-v
    (exec :form-db queries/get-application-count-by-year {})))

(defn get-accepted-count-by-year []
  (year-to-int-all-v
    (exec :form-db queries/get-evaluation-count-by-year
          {:status "accepted"})))

(defn get-rejected-count-by-year []
  (year-to-int-all-v
    (exec :form-db queries/get-evaluation-count-by-year
          {:status "rejected"})))

(defn get-year-report []
  {:applications (get-application-count-by-year)
   :evaluations-accepted (get-accepted-count-by-year)
   :evaluations-rejected (get-rejected-count-by-year)})
