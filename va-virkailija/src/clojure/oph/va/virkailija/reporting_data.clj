(ns oph.va.virkailija.reporting-data
  (:require
   [oph.soresu.common.db :refer [exec]]
   [oph.va.virkailija.db.queries :as queries]
   [oph.va.hakija.api :refer [convert-to-dash-keys]]
   [clojure.pprint :refer [print-table]])
  (:import (oph.va.jdbc.enums HakuStatus)))

(defn year-to-int-all-v [c]
  (mapv #(update % :year int) c))

(defn get-yearly-application-info []
  (mapv convert-to-dash-keys
        (year-to-int-all-v
         (exec :form-db queries/get-yearly-application-info {}))))

(defn get-accepted-count-by-year []
  (year-to-int-all-v
   (exec :form-db queries/get-yearly-evaluation-count-by-status
         {:status "accepted"})))

(defn get-rejected-count-by-year []
  (year-to-int-all-v
   (exec :form-db queries/get-yearly-evaluation-count-by-status
         {:status "rejected"})))

(defn get-yearly-granted []
  (mapv convert-to-dash-keys
        (year-to-int-all-v
         (exec :form-db queries/get-yearly-granted {}))))

(defn get-total-grant-count []
  (first (exec :form-db queries/get-total-grant-count {})))

(defn total-value [c k]
  (reduce #(+ %1 (get %2 k)) 0 c))

(defn calculate-totals [applications granted]
  {:budget-total (total-value applications :budget-total)
   :budget-oph-share (total-value applications :budget-oph-share)
   :budget-granted (total-value granted :budget-granted)
   :costs-granted (total-value granted :costs-granted)})

(defn get-yearly-report []
  {:applications (get-yearly-application-info)
   :evaluations-accepted (get-accepted-count-by-year)
   :evaluations-rejected (get-rejected-count-by-year)
   :granted (get-yearly-granted)
   :total-grant-count (:count (get-total-grant-count))})

(defn get-yearly-report-str []
  (let [report (get-yearly-report)]
    (with-out-str
      (prn "Applications")
      (print-table (:applications report))
      (prn "Evaluations accepted")
      (print-table (:evaluations-accepted report))
      (prn "Evaluations rejected")
      (print-table (:evaluations-rejected report))
      (prn "Granted")
      (print-table (:granted report))
      (prn "Total grant count")
      (:total-grant-count report))))
