(ns oph.va.virkailija.reporting-data
  (:require
   [oph.soresu.common.db :refer [exec]]
   [oph.va.virkailija.db.queries :as queries]
   [oph.va.hakija.api :refer [convert-to-dash-keys]])
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

(defn get-year-report []
  {:applications (get-yearly-application-info)
   :evaluations-accepted (get-accepted-count-by-year)
   :evaluations-rejected (get-rejected-count-by-year)
   :granted (get-yearly-granted)})
