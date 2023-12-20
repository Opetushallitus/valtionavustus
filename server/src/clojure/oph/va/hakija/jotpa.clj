(ns oph.va.hakija.jotpa
  (:require [oph.soresu.common.config :refer [feature-enabled?]] ))

(defn is-jotpa-avustushaku [avustushaku]
  (and (feature-enabled? :jotpa-hakemuksen-lomakkeen-kustomointi)
       (= (:operational_unit_code avustushaku) "6600105300")))
