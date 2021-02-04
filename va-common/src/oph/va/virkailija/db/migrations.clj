(ns oph.va.virkailija.db.migrations
  (:require [oph.soresu.common.db.migrations :as migrations]
            [oph.soresu.common.db :as common-db]
            [yesql.core :refer [defquery]])
  (:gen-class))

(defn migrate [& migration-paths]
  (migrations/migrate "virkailija" migration-paths))

(defn- create-rahoitusalue-json [rahoitusalue]
  {:rahoitusalue (:rahoitusalue rahoitusalue)
   :talousarviotilit ["momentti"]})

(defn get-avustushaku [id]
  (first (common-db/query "select * from avustushaut where id = ? and status <> 'deleted'" [id])))

(defquery list-used-rahoitusalueet "db/migration/queries/m1_21-list-used-rahoitusalueet.sql")
(defquery update-avustushaku-content! "db/migration/queries/m1_21-update-avustushaku-content.sql")
(migrations/defmigration migrate-add-rahoitusalueet-for-avustushaut "1.21"
                         "Add used rahoitusalueet to avustushaut"
                         (let [used-rahoitusalueet (common-db/exec list-used-rahoitusalueet {})
                               avustushakujen-rahoitusalueet (group-by :avustushaku used-rahoitusalueet)]
                           (doseq [avustushaku-id (keys avustushakujen-rahoitusalueet)]
                             (let [avustushaku (get-avustushaku avustushaku-id)
                                   avustushaun-rahoitusalueet (get avustushakujen-rahoitusalueet avustushaku-id)
                                   rahoitusalueet-json (map create-rahoitusalue-json avustushaun-rahoitusalueet)
                                   new-content (assoc (:content avustushaku) :rahoitusalueet rahoitusalueet-json)
                                   changed-avustushaku (assoc avustushaku :content new-content)]
                               (common-db/exec update-avustushaku-content! changed-avustushaku)))))
