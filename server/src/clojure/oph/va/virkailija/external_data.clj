(ns oph.va.virkailija.external-data
  (:require [oph.soresu.common.db :refer [exec]]
            [oph.va.virkailija.utils :refer [convert-to-dash-keys]]
            [oph.va.virkailija.db.external-queries :as external-queries]
            [clj-time.core :as t]
            [oph.common.datetime :as datetime]))

(defmulti avustushaku-phase (fn [avustushaku] [(:status avustushaku)
                                               (t/after? (datetime/now) (datetime/parse (:start (:duration (:content avustushaku)))))
                                               (t/before? (datetime/now) (datetime/parse (:end (:duration (:content avustushaku)))))]))

(defmethod avustushaku-phase ["published" true true]  [_] "current")
(defmethod avustushaku-phase ["published" true false] [_] "ended")
(defmethod avustushaku-phase ["published" false true] [_] "upcoming")
(defmethod avustushaku-phase ["resolved" true false] [_] "ended")
(defmethod avustushaku-phase :default  [_] "unpublished")

(defn add-phase [avustushaku]
  (merge {:phase  (avustushaku-phase avustushaku)} avustushaku))

(defn get-grants-for-year [year]
  (let [rows (exec external-queries/get-grants-for-year {:year year})]
    (map add-phase (map convert-to-dash-keys rows))))

(defn get-applications-by-grant-id [grant-id]
  (let [rows (exec external-queries/get-applications-by-grant-id {:grant_id grant-id})]
    (map convert-to-dash-keys rows)))
