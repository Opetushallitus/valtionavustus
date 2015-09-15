(ns oph.va.virkailija.db
  (:use [oph.common.db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.db.queries :as queries]))

(defn get-arviot [hakemus-ids]
  (exec :db queries/get-arviot {:hakemus_ids hakemus-ids}))

(defn update-or-create-hakemus-arvio [hakemus-id, arvio]
  (let [status (keyword (:status arvio))
        updated (exec :db queries/update-arvio<! {:hakemus_id hakemus-id :status status})]
    (if updated
      updated
      (exec :db queries/create-arvio<! {:hakemus_id hakemus-id :status status}))))

(defn health-check []
  (->> {}
       (exec :db queries/health-check)
       first
       :?column?
       (= 1)))
