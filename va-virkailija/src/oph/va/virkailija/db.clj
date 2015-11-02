(ns oph.va.virkailija.db
  (:use [oph.soresu.common.db]
        [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.db.queries :as queries]))

(defn get-arviot [hakemus-ids]
  (if (empty? hakemus-ids)
    []
    (exec :db queries/get-arviot {:hakemus_ids hakemus-ids})))

(defn get-arvio [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec :db queries/get-arvio)
       first))

(defn update-or-create-hakemus-arvio [hakemus-id arvio]
  (let [status (keyword (:status arvio))
        budget-granted (:budget-granted arvio)
        updated (exec :db queries/update-arvio<! {:hakemus_id hakemus-id :status status :budget_granted budget-granted})]
    (if updated
      updated
      (exec :db queries/create-arvio<! {:hakemus_id hakemus-id :status status}))))

(defn health-check []
  (->> {}
       (exec :db queries/health-check)
       first
       :?column?
       (= 1)))

(defn get-or-create-arvio [hakemus-id]
  (if-let [arvio (get-arvio hakemus-id)]
    arvio
    (update-or-create-hakemus-arvio hakemus-id {:status "unhandled"})))

(defn list-comments [hakemus-id]
  (let [arvio-id (:id (get-or-create-arvio hakemus-id))]
    (exec :db queries/list-comments {:arvio_id arvio-id})))

(defn add-comment [hakemus-id first-name last-name email comment]
  (let [arvio-id (:id (get-or-create-arvio hakemus-id))]
    (when-let [id (->> {:arvio_id arvio-id
                        :first_name first-name
                        :last_name last-name
                        :email email
                        :comment comment}
                       (exec :db queries/create-comment<!))]
      (list-comments hakemus-id))))

(defn score->map [score]
  {:arvio-id (:arvio_id score)
   :person-oid (:person_oid score)
   :first-name (:first_name score)
   :last-name (:last_name score)
   :email (:email score)
   :selection-criteria-index (:selection_criteria_index score)
   :score (:score score)
   :created-at (:created_at score)
   :modified-at (:modified_at score)})

(defn list-scores [arvio-id]
  (->> (exec :db queries/list-scores {:arvio_id arvio-id})
       (map score->map)))

(defn list-avustushaku-scores [avustushaku-id]
  (->> (exec :db queries/list-avustushaku-scores {:avustushaku_id avustushaku-id})
       (map score->map)))

(defn- update-or-create-score [avustushaku-id arvio-id identity selection-criteria-index score]
  (let [params {:avustushaku_id           avustushaku-id
                :arvio_id                 arvio-id
                :person_oid               (:person-oid identity)
                :first_name               (:first-name identity)
                :last_name                (:surname identity)
                :email                    (:email identity)
                :selection_criteria_index selection-criteria-index
                :score                    score}]
    (if-let [updated (exec :db queries/update-score<! params)]
        updated
        (exec :db queries/create-score<! params))))

(defn add-score [avustushaku-id arvio-id identity selection-criteria-index score]
  (update-or-create-score avustushaku-id arvio-id identity selection-criteria-index score))

(defn find-search [avustushaku-id query]
  (->> {:avustushaku_id avustushaku-id :query query}
       (exec :db queries/find-search)
       first))

(defn create-search! [avustushaku-id query name person-oid]
  (exec :db queries/create-search<! {:avustushaku_id avustushaku-id
                                     :query query
                                     :name name
                                     :oid person-oid}))

(defn get-search [avustushaku-id saved-search-id]
  (->> {:avustushaku_id avustushaku-id :id saved-search-id}
       (exec :db queries/get-search)
       first))
