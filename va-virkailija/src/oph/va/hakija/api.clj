(ns oph.va.hakija.api
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.common.db :refer :all]
            [oph.va.hakija.api.queries :as hakija-queries]))


(defn health-check []
  (->> {}
       (exec :hakija-db hakija-queries/health-check)
       first
       :?column?
       (= 1)))

(defn list-hakemukset [avustushaku-id]
  (exec :hakija-db hakija-queries/list-hakemukset { :avustushaku_id avustushaku-id }))
