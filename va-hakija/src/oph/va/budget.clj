(ns oph.va.budget
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.form.validation :as validation])
  (require [clojure.core.reducers :as r]))

(declare do-calculate-totals)
(declare read-amount)

(defn calculate-totals [answers avustushaku form]
  (let [self-financing-percentage (-> avustushaku :content :self-financing-percentage)
        all-form-elements (validation/flatten-elements (:content form))
        budget-fields (filter (fn [field] (= (:displayAs field) "vaBudget")) all-form-elements)
        all-budget-summaries (map (fn [budget-field] (do-calculate-totals budget-field answers self-financing-percentage)) budget-fields )]

    (nth all-budget-summaries 0)))

(defn- do-calculate-totals [budget-field answers self-financing-percentage]
  (let [all-budget-field-children (:children budget-field)
        summing-fields (filter (fn [field] (= (:displayAs field) "vaSummingBudgetElement")) all-budget-field-children)
        budget-item-elements (flatten (map (fn [summing-field] (:children summing-field)) summing-fields))
        budget-item-sums (map (fn [item] (read-amount item answers)) budget-item-elements)
        total-sum (r/fold + budget-item-sums)]
    {:total-needed total-sum
     :oph-share (* (/ (- 100 self-financing-percentage) 100) total-sum)}
    ))

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