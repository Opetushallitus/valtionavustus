(ns oph.va.virkailija.db
  (:use [oph.soresu.common.db]
        [clojure.data :as data]
        [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.form.formutil :as formutil]
            [oph.va.virkailija.db.queries :as queries]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.budget :as va-budget])
  (:import [java.util Date]))

(defn get-arviot [hakemus-ids]
  (if (empty? hakemus-ids)
    []
    (exec :db queries/get-arviot {:hakemus_ids hakemus-ids})))

(defn get-arvio [hakemus-id]
  (->> {:hakemus_id hakemus-id}
       (exec :db queries/get-arvio)
       first))

(defn- ->changelog-entry [identity type timestamp data]
  {:type type
   :timestamp timestamp
   :data data
   :person-oid (:person-oid identity)
   :username (:username identity)
   :first-name (:first-name identity)
   :last-name (:surname identity)
   :email (:email identity)})

(defn- append-changelog [changelog entry]
  (cons entry changelog))

(defn- compare-summary-comment [changelog identity timestamp existing new]
  (let [old-comment (:summary_comment existing)
        new-comment (:summary_comment new)]
    (if (not (= old-comment new-comment))
      (append-changelog changelog (->changelog-entry identity
                                                     "summary-comment"
                                                     timestamp
                                                     {:old old-comment
                                                      :new new-comment}))
      changelog)))

(defn- compare-budget-granted [changelog identity timestamp existing new]
  (let [new-budget (:budget_granted new)
        existing-budget (:budget_granted existing)]
    (if (not (= new-budget existing-budget))
      (append-changelog changelog (->changelog-entry identity
                                                     "budget-change"
                                                     timestamp
                                                     {:old existing-budget
                                                      :new new-budget}))
      changelog)))

(defn- compare-overrode-answers [changelog identity timestamp existing new]
  (let [new-answers (formutil/unwrap-answers (:value (:overrode_answers new)) [])
        existing-answers (formutil/unwrap-answers (:value (:overrode_answers existing)) [])
        diff-answers (data/diff new-answers existing-answers)
        added-answers (first diff-answers)
        removed-answers (second diff-answers)]
    (if (some some? [added-answers removed-answers])
      (append-changelog changelog (->changelog-entry identity
                                                     "overrode-answers-change"
                                                     timestamp
                                                     {:old removed-answers
                                                      :new added-answers}))
      changelog)))

(defn- compare-status [changelog identity timestamp existing new]
  (if (not (= (:status new) (keyword (:status existing))))
    (append-changelog changelog (->changelog-entry identity
                                                   "status-change"
                                                   timestamp
                                                   {:old (:status existing)
                                                    :new (:status new)}))
    changelog))

(defn- update-changelog [identity existing new]
  (let [changelog (:changelog existing)
        timestamp (Date.)]
    (if identity
      (-> (if changelog changelog [])
        (compare-status identity timestamp existing new)
        (compare-budget-granted identity timestamp existing new)
        (compare-summary-comment identity timestamp existing new)
        (compare-overrode-answers identity timestamp existing new))
      changelog)))

(defn- calculate-total-oph-budget [avustushaku-id status arvio]
  (cond
    (= status :rejected) 0
    (not (:overrode-answers arvio)) (:budget-granted arvio)
    :else (let [avustushaku (hakija-api/get-avustushaku avustushaku-id)
                       form (hakija-api/get-form-by-avustushaku avustushaku-id)
                       calculated-budget (va-budget/calculate-totals (:overrode-answers arvio) avustushaku form)]
                    (:oph-share calculated-budget))))

(defn update-or-create-hakemus-arvio [avustushaku-id hakemus-id arvio identity]
  (let [status (keyword (:status arvio))
        budget-granted (calculate-total-oph-budget avustushaku-id status arvio)
        overrode-answers (:overrode-answers arvio)
        arvio-to-save  {:hakemus_id hakemus-id
                        :status status
                        :overrode_answers overrode-answers
                        :budget_granted budget-granted
                        :summary_comment (:summary-comment arvio)}
        existing (get-arvio hakemus-id)
        changelog (update-changelog identity existing arvio-to-save)
        arvio-with-changelog (assoc arvio-to-save :changelog [changelog])]
    (if existing
      (exec :db queries/update-arvio<! arvio-with-changelog)
      (exec :db queries/create-arvio<! arvio-with-changelog))))

(defn health-check []
  (->> {}
       (exec :db queries/health-check)
       first
       :?column?
       (= 1)))

(defn get-or-create-arvio [hakemus-id]
  (if-let [arvio (get-arvio hakemus-id)]
    arvio
    (exec :db queries/create-empty-arvio<! {:hakemus_id hakemus-id})))

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
