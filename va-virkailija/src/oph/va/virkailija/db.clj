(ns oph.va.virkailija.db
  (:use [oph.common.db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.db.queries :as queries]))

(defn get-arviot [hakemus-ids]
  (exec :db queries/get-arviot {:hakemus_ids hakemus-ids}))

(defn health-check []
  (->> {}
       (exec :db queries/health-check)
       first
       :?column?
       (= 1)))
