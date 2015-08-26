(ns oph.va.virkailija.db
  (:use [oph.common.db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.db.queries :as queries]))


(defn health-check []
  (->> {}
       (exec queries/health-check)
       first
       :?column?
       (= 1)))
