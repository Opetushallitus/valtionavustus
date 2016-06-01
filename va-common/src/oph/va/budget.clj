(ns oph.va.budget
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.form.formutil :as formutil]
            [clojure.core.reducers :as r]))

(declare do-calculate-totals)
(declare read-amount-income)

(defn is-budget-field? [element]
  (formutil/has-field-type? "vaBudget" element))

(defn calculate-totals-virkailija [answers avustushaku form use-detailed-costs costs-granted]
  (let [self-financing-percentage (-> avustushaku :content :self-financing-percentage)
        all-budget-summaries (->> (:content form)
                                  formutil/flatten-elements
                                  (filter is-budget-field?)
                                  (map (partial do-calculate-totals answers self-financing-percentage use-detailed-costs costs-granted )))]
    (first all-budget-summaries)))

(defn calculate-totals [answers avustushaku form]
  (calculate-totals-virkailija answers avustushaku form true 0))

(defn find-summing-fields [children]
  (-> (partial formutil/has-field-type? "vaSummingBudgetElement")
      (filter children)))

(defn- find-budget-item-elements [children]
  (-> (fn [summing-field] (:children summing-field))
      (map children)
      flatten))

(defn- sum-budget-items [answers only-incomes children]
  (-> (fn [item] (read-amount-income item answers only-incomes))
      (map children)))

(defn- do-calculate-totals [answers self-financing-percentage use-detailed-costs costs-granted budget-field ]
  (let [only-incomes (not use-detailed-costs)
        total-row-sum (->> (:children budget-field)
                       find-summing-fields
                       find-budget-item-elements
                       (sum-budget-items answers only-incomes)
                       (r/fold +))
        total-sum (if use-detailed-costs total-row-sum (+ total-row-sum costs-granted))
        self-financing-share (-> (/ self-financing-percentage 100)
                                 (* total-sum)
                                 Math/ceil
                                 int)
        oph-share (max (- total-sum self-financing-share) 0)]
    (print use-detailed-costs costs-granted total-row-sum only-incomes total-sum)
    {:total-needed total-sum
     :oph-share oph-share}))

(defn amount-field-of [budget-item]
  (nth (:children budget-item) 1))

(defn- sanitise [raw-answer-value]
  (try
    (Integer/parseInt raw-answer-value)
    (catch Exception e
      0)))

(defn read-amount [budget-item answers]
  (let [raw-answer-value (formutil/find-answer-value answers (:id (amount-field-of budget-item)))
        numeric-value (sanitise raw-answer-value)]
    numeric-value))

(defn read-amount-income [budget-item answers only-incomes]
  (let [numeric-value (read-amount budget-item answers)
        increments-total (-> budget-item :params :incrementsTotal)
        coefficient (if increments-total (if only-incomes 0 1) -1)]
    (* coefficient numeric-value)))


