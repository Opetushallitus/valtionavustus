(ns oph.va.virkailija.scoring
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:require [oph.va.virkailija.db :as virkailija-db]))

(defn get-avustushaku-scores [avustushaku-id]
  (virkailija-db/list-avustushaku-scores avustushaku-id))
