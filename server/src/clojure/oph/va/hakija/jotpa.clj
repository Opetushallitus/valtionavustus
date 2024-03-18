(ns oph.va.hakija.jotpa
  (:require [oph.soresu.common.config :refer [feature-enabled?]] ))

(defn is-jotpa-avustushaku [avustushaku]
     (or (= (:operational-unit-code avustushaku) "6600105300")
         (= (:operational_unit_code avustushaku) "6600105300")))
