(ns oph.va.budget
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.form.validation :as validation])
  (require [clojure.core.reducers :as r]))

(declare do-calculate-totals)
(declare read-amount)

(defn- is-budget-field? [element]
  (= (:displayAs element) "vaBudget"))

(defn calculate-totals [answers avustushaku form]
  (let [self-financing-percentage (-> avustushaku :content :self-financing-percentage)
        all-budget-summaries (->> (:content form)
                                  validation/flatten-elements
                                  (filter is-budget-field?)
                                  (map (fn [f] (do-calculate-totals answers self-financing-percentage f))))]
    (assert (= 1 (count all-budget-summaries)) (str "Expected only one budget field but got " (count all-budget-summaries)))
    (first all-budget-summaries)))

(defn- find-summing-fields [children]
  (-> (fn [field] (= (:displayAs field) "vaSummingBudgetElement"))
      (filter children)))

(defn- find-budget-item-elements [children]
  (-> (fn [summing-field] (:children summing-field))
      (map children)
      flatten))

(defn- sum-budget-items [answers children]
  (-> (fn [item] (read-amount item answers))
      (map children)))

(defn- do-calculate-totals [answers self-financing-percentage budget-field]
  (let [total-sum (->> (:children budget-field)
                       find-summing-fields
                       find-budget-item-elements
                       (sum-budget-items answers)
                       (r/fold +))
        self-financing-share (-> (/ self-financing-percentage 100)
                                 (* total-sum)
                                 Math/ceil
                                 int)
        oph-share (- total-sum self-financing-share)]
    {:total-needed total-sum
     :oph-share oph-share}))

(defn- amount-field-of [budget-item]
  (nth (:children budget-item) 1))

(defn- sanitise [raw-answer-value]
  (try
    (Integer/parseInt raw-answer-value)
    (catch Exception e
      0)))

(defn- read-amount [budget-item answers]
  (let [raw-answer-value (validation/find-answer-value answers (:id (amount-field-of budget-item)))
        numeric-value (sanitise raw-answer-value)
        increments-total (-> budget-item :params :incrementsTotal)
        coefficient (if increments-total 1 -1)]
    (* coefficient numeric-value)))
