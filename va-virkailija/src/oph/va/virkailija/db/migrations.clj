(ns oph.va.virkailija.db.migrations
  (:require [oph.soresu.common.db.migrations :as migrations]
            [oph.soresu.common.db :as common-db]
            [yesql.core :refer [defquery]]
            [clojure.set :as set])
  (:gen-class))

(defn migrate [ds-key & migration-paths]
  (apply (partial migrations/migrate ds-key) migration-paths))

(defquery query-list-avustushaut-all "db/migration/queries/m1_20-list-avustushaut-all.sql")
(defquery update-avustushaku-decision! "db/migration/queries/m1_20-update-avustushaku-decision.sql")

(migrations/defmigration migrate-rename-avustushaku-decision-json-key-from-esittelija-to-valmistelija "1.20"
  "Rename avustushaku decision json key from \"esittelija\" to \"valmistelija\""
  (doseq [avustushaku (common-db/exec :form-db query-list-avustushaut-all {})]
    (let [new-decision (set/rename-keys (:decision avustushaku) {:esittelija :valmistelija})
          changed-avustushaku (assoc avustushaku :decision new-decision)]
      (common-db/exec :form-db update-avustushaku-decision! changed-avustushaku))))
