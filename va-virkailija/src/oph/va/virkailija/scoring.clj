(ns oph.va.virkailija.scoring
  (:use [clojure.tools.trace :only [trace]]
        [clojure.pprint :only [pprint]])
  (:require [oph.va.virkailija.db :as virkailija-db]
            [oph.va.hakija.api :as hakija-api]))

(defn- avg-of-scores [scores selection-criteria-count]
  (let [sum (reduce + (map :score scores))]
    (/ sum selection-criteria-count)))

(defn- aggregate-complete-arvio-scores-by-user [arvio-scores selection-criteria-count]
  (let [scores-by-user (group-by (fn [score] (:person-oid score)) arvio-scores)
        complete-scorings-of-arvio (filter (fn [oid-with-scores]
                                               (= selection-criteria-count (-> oid-with-scores second vals count)))
                                           scores-by-user)
        averages-with-oids (map (fn [oid-with-scores] {:person-oid (first oid-with-scores)
                                                       :score-average (avg-of-scores (second oid-with-scores) selection-criteria-count)})
                                complete-scorings-of-arvio)]
    averages-with-oids))

(defn- avg-of-user-averages [user-averages]
  (let [count-of-user-averages (count user-averages)
        sum (reduce + (map :score-average user-averages))]
    (if (> count-of-user-averages 0)
      (/ sum (count user-averages))
      0)))

(defn- aggregate-full-scores-by-arvio-and-user [all-avustushaku-scores selection-criteria-count]
  (let [scores-by-arvio (group-by (fn [score] (:arvio-id score)) all-avustushaku-scores)
        complete-scorings-by-arvio-and-user (map (fn [arvio-with-scores]
                                                   {:arvio-id (first arvio-with-scores)
                                                    :score-averages-by-user (aggregate-complete-arvio-scores-by-user (second arvio-with-scores)
                                                                                                                     selection-criteria-count)})
                                                 scores-by-arvio)
        scoring-records (map (fn [arvio-with-averages]
                               {:arvio-id (:arvio-id arvio-with-averages)
                                :score-total-average (avg-of-user-averages (:score-averages-by-user arvio-with-averages))
                                :score-averages-by-user (:score-averages-by-user arvio-with-averages)})
                             complete-scorings-by-arvio-and-user)]
    ;(pprint scoring-records)
    scoring-records))

(defn get-avustushaku-scores [avustushaku-id]
  (let [all-avustushaku-scores (virkailija-db/list-avustushaku-scores avustushaku-id)
        selection-criteria-count (count (-> (hakija-api/get-avustushaku avustushaku-id)
                                            :content
                                            :selection-criteria
                                            :items))]
    (aggregate-full-scores-by-arvio-and-user all-avustushaku-scores selection-criteria-count)))

(defn get-arvio-scores [arvio-id]
  (virkailija-db/list-scores arvio-id))

(defn add-score [avustushaku-id hakemus-id identity selection-criteria-index score]
  (virkailija-db/add-score avustushaku-id hakemus-id identity selection-criteria-index score))
