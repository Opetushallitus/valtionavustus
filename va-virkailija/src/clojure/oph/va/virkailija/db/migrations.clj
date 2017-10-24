(ns oph.va.virkailija.db.migrations
  (:require [oph.soresu.common.db.migrations :as migrations]
            [oph.soresu.common.db :as common-db]
            [oph.va.hakija.api :as hakija-api]
            [yesql.core :refer [defquery]])
  (:gen-class))

(defn migrate [ds-key & migration-paths]
  (apply (partial migrations/migrate ds-key) migration-paths))

(defn- create-rahoitusalue-json [rahoitusalue]
  {:rahoitusalue (:rahoitusalue rahoitusalue)
   :talousarviotilit ["momentti"]})

(defquery list-used-rahoitusalueet "db/migration/queries/m1_21-list-used-rahoitusalueet.sql")
(defquery update-avustushaku-content! "db/migration/queries/m1_21-update-avustushaku-content.sql")
(migrations/defmigration migrate-add-rahoitusalueet-for-avustushaut "1.21"
                         "Add used rahoitusalueet to avustushaut"
                         (let [used-rahoitusalueet (common-db/exec :virkailija-db list-used-rahoitusalueet {})
                               avustushakujen-rahoitusalueet (group-by :avustushaku used-rahoitusalueet)]
                           (doseq [avustushaku-id (keys avustushakujen-rahoitusalueet)]
                             (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
                                   avustushaun-rahoitusalueet (get avustushakujen-rahoitusalueet avustushaku-id)
                                   rahoitusalueet-json (map create-rahoitusalue-json avustushaun-rahoitusalueet)
                                   new-content (assoc (:content avustushaku) :rahoitusalueet rahoitusalueet-json)
                                   changed-avustushaku (assoc avustushaku :content new-content)]
                               (common-db/exec :form-db update-avustushaku-content! changed-avustushaku)))))
