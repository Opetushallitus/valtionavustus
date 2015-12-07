(ns oph.va.virkailija.scoring
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:require [oph.va.virkailija.db :as virkailija-db]
            [oph.va.hakija.api :as hakija-api]))

(defn- sum-scores [scores key-fn]
  (reduce + (map key-fn scores)))

(defn- avg-of-scores [scores selection-criteria-count]
  (/ (sum-scores scores :score) selection-criteria-count))

(defn- aggregate-complete-arvio-scores-by-user [arvio-scores selection-criteria-count]
  (letfn [(make-user-map [arvio-scores] (->> arvio-scores
                                             (map score->user)
                                             (distinct)
                                             (group-by :person-oid)))
          (score->user [score] {:person-oid (:person-oid score)
                                :first-name (:first-name score)
                                :last-name (:last-name score)
                                :email (:email score)})
          (scores-by-user [score] (:person-oid score))
          (complete-scorings [oid-with-scores]
            (= selection-criteria-count (-> oid-with-scores second vals count)))
          (averages-with-oids [user-map oid-with-scores]
            (merge (first (get user-map (first oid-with-scores)))
                   {:score-average (avg-of-scores (second oid-with-scores)
                                                  selection-criteria-count)}))]
    (let [users (make-user-map arvio-scores)]
      (->> arvio-scores
           (group-by scores-by-user)
           (filter complete-scorings)
           (map (partial averages-with-oids users))))))

(defn- avg-of-user-averages [user-averages]
  (let [user-avg-count (count user-averages)
        sum (sum-scores user-averages :score-average)]
    (if (> user-avg-count 0)
      (/ sum user-avg-count)
      0)))

(defn- aggregate-single-arvio-scores-by-user [arvio-id arvio-scores selection-criteria-count]
  {:arvio-id arvio-id
   :score-averages-by-user (aggregate-complete-arvio-scores-by-user arvio-scores selection-criteria-count)})

(defn- complete-scorings-by-arvio-and-user [selection-criteria-count arvio-with-scores]
  (aggregate-single-arvio-scores-by-user (first arvio-with-scores)
                                         (second arvio-with-scores)
                                         selection-criteria-count))

(defn- create-single-arvio-aggregate [arvio-id-with-averages]
  {:arvio-id (:arvio-id arvio-id-with-averages)
   :score-total-average (avg-of-user-averages (:score-averages-by-user arvio-id-with-averages))
   :score-averages-by-user (:score-averages-by-user arvio-id-with-averages)})

(defn aggregate-full-scores-by-arvio-and-user [all-avustushaku-scores selection-criteria-count]
  (letfn [(scores-by-arvio [score] (:arvio-id score))]
    (->> all-avustushaku-scores
         (group-by scores-by-arvio)
         (map (comp create-single-arvio-aggregate
                    (partial complete-scorings-by-arvio-and-user selection-criteria-count))))))

(defn- get-selection-criteria-count [avustushaku-id]
  (count (-> (hakija-api/get-avustushaku avustushaku-id)
             :content
             :selection-criteria
             :items)))

(defn get-avustushaku-scores [avustushaku-id]
  (let [all-avustushaku-scores (virkailija-db/list-avustushaku-scores avustushaku-id)
        selection-criteria-count (get-selection-criteria-count avustushaku-id)]
    (aggregate-full-scores-by-arvio-and-user all-avustushaku-scores selection-criteria-count)))

(defn get-arvio-scores [avustushaku-id arvio-id]
  (if-let [selection-criteria-count (get-selection-criteria-count avustushaku-id)]
    (let [arvio-scores (virkailija-db/list-scores arvio-id)
          arvio-id-with-averages (aggregate-single-arvio-scores-by-user arvio-id
                                                                        (virkailija-db/list-scores arvio-id)
                                                                        selection-criteria-count)]
      {:scoring (create-single-arvio-aggregate arvio-id-with-averages)
       :scores arvio-scores})))

(defn add-score [avustushaku-id hakemus-id identity selection-criteria-index score]
  (let [arvio-id (:id (virkailija-db/get-or-create-arvio hakemus-id identity))]
    (virkailija-db/add-score avustushaku-id arvio-id identity selection-criteria-index score)
    (get-arvio-scores avustushaku-id arvio-id)))
