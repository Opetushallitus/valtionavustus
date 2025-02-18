(ns oph.va.virkailija.db.migrations
  (:require [oph.soresu.common.db.migrations :as migrations]
            [oph.soresu.common.db :as common-db]
            [oph.va.menoluokka.db :as menoluokka-db]
            [clojure.tools.logging :as log]
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

(defn- parameter-list [list]
  (clojure.string/join ", " (take (count list) (repeat "?"))))

(defn- upsert-menoluokka [tx application-id menoluokka]
  (let [id-rows (common-db/query tx
                                 "INSERT INTO virkailija.menoluokka (avustushaku_id, type, translation_fi, translation_sv)
              VALUES (?, ?, ?, ?)
              ON CONFLICT (avustushaku_id, type) DO UPDATE SET
                translation_fi = EXCLUDED.translation_fi,
                translation_sv = EXCLUDED.translation_sv
              RETURNING id"
                                 [application-id (:type menoluokka) (:translation_fi menoluokka) (:translation_sv menoluokka)])]
    (:id (first id-rows))))

(defn- budget->menoluokka [budget-elem]
  {:type (:id budget-elem)
   :translation_fi (:fi (:label budget-elem))
   :translation_sv (:sv (:label budget-elem))})

(defn- form->menoluokka [form]
  (let [content         (:content form)
        plan            (if content (first (filter #(when (= (:id %) "financing-plan") %) content)))
        budget          (if (:children plan) (first (filter #(when (= (:id %) "budget") %) (:children plan))))
        project-budget  (if (:children budget) (first (filter #(when (= (:id %) "project-budget") %) (:children budget))))
        menoluokka-rows (if (:children project-budget) (map budget->menoluokka (:children project-budget)))]
    menoluokka-rows))

(defn- remove-old-menoluokka-rows [tx application-id current-menoluokka-ids]
  (common-db/execute! tx
                      (str "DELETE FROM virkailija.menoluokka WHERE avustushaku_id = ? AND id NOT IN (" (parameter-list current-menoluokka-ids) ")")
                      (conj current-menoluokka-ids application-id)))

(defn- upsert-menoluokka-rows [application-id form]
  (if-let [menoluokka-rows (form->menoluokka form)]
    (common-db/with-tx (fn [tx]
                         (let [current-menoluokka-ids (map (partial upsert-menoluokka tx application-id) menoluokka-rows)]
                           (remove-old-menoluokka-rows tx application-id current-menoluokka-ids))))))

(defn- get-form-by-avustushaku [avustushaku-id]
  (first (common-db/query
          "select f.* from hakija.forms f join hakija.avustushaut a on a.form = f.id where a.id = ?"
          [avustushaku-id])))

(defn- fix-menoluokkas-for-avustushaku [avustushaku-id]
  (log/info "Adding menoluokkas to avustushaku id " avustushaku-id)
  (let [form (get-form-by-avustushaku avustushaku-id)
        menoluokkas-count (:count (first (common-db/query "SELECT COUNT(id) FROM virkailija.menoluokka WHERE avustushaku_id = ?"
                                                          [avustushaku-id])))]
    (if (= menoluokkas-count 0)
      (upsert-menoluokka-rows avustushaku-id form)
      (log/info "Menoluokkas already exist for avustushaku " avustushaku-id " count " menoluokkas-count))))

(migrations/defmigration migrate-add-menoluokkas-for-avustushaut "1.119"
  "Add menoluokkas to avustushaut starting from id 324"
  (doseq [avustushaku-id (map :id (common-db/query "SELECT id FROM avustushaut WHERE id >= 324 AND status <> 'deleted'" []))]
    (fix-menoluokkas-for-avustushaku avustushaku-id)))

(defn avustushaut-324-and-over-without-menoluokka-with-use-detailed-costs []
  (common-db/query "select distinct
                      hakemukset.id as hakemus_id,
                      avustushaku as avustushaku_id,
                      overridden_answers from hakemukset
                    join arviot on arviot.hakemus_id = hakemukset.id
                    where avustushaku >= 324 and use_overridden_detailed_costs = true" []))

(migrations/defmigration migrate-lisaa-menoluokat-hakemusten-arvioille "1.120"
  "Lisää menoluokat hakemusten arvioille id 324 eteenpäin"
  (doseq [hakemus-info (avustushaut-324-and-over-without-menoluokka-with-use-detailed-costs)]
    (log/info "Creating menoluokka_hakemus rows for hakemus id " (:hakemus-id hakemus-info))
    (menoluokka-db/store-menoluokka-hakemus-rows
     (:avustushaku-id hakemus-info)
     (:hakemus-id hakemus-info)
     (:overridden-answers hakemus-info))))

