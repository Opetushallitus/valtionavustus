(ns oph.va.hakija.db.migrations
  (:require [oph.common.db.migrations :as migrations])
  (:gen-class))

(defn migrate [ds-key & migration-paths]
  (apply (partial migrations/migrate ds-key) migration-paths))

;; (defmigration TestMigration "1.4"
;;   "My test migration"
;;   (println "foobar"))
