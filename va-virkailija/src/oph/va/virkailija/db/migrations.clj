(ns oph.va.virkailija.db.migrations
  (:require [oph.soresu.common.db.migrations :as migrations])
  (:gen-class))

(defn migrate [ds-key & migration-paths]
  (apply (partial migrations/migrate ds-key) migration-paths))
