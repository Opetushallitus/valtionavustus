(ns oph.va.budget
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.form.formutil :as formutil]
            [clojure.core.reducers :as r]))

(defn- sanitise [raw-answer-value]
  (try
    (Integer/parseInt raw-answer-value)
    (catch Exception e
      0)))

(defn amount-field-of [budget-item]
  (nth (:children budget-item) 1))

(defn read-amount [budget-item answers]
  (let [raw-answer-value (formutil/find-answer-value answers (:id (amount-field-of budget-item)))
        numeric-value (sanitise raw-answer-value)]
    numeric-value))

(defn read-amount-income [budget-item answers only-incomes]
  (let [numeric-value (read-amount budget-item answers)
        increments-total (-> budget-item :params :incrementsTotal)
        coefficient (if increments-total (if only-incomes 0 1) -1)]
    (* coefficient numeric-value)))

(defn is-budget-field? [element]
  (formutil/has-field-type? "vaBudget" element))

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

(defn- select-self-financing-amount [answers budget-summary-field self-financing-percentage total-sum]
  (let [min-self-financing-amount (-> (/ self-financing-percentage 100)
                                      (* total-sum)
                                      Math/ceil
                                      int)]
    (if-let [self-financing-field-id (some-> budget-summary-field
                                             list
                                             (formutil/find-fields* #(= "vaSelfFinancingField" (:fieldType %)))
                                             first
                                             :id)]
      (let [self-financing-amount (sanitise (formutil/find-answer-value answers self-financing-field-id))]
        (max self-financing-amount min-self-financing-amount))
      min-self-financing-amount)))

(defn- do-calculate-totals [answers self-financing-percentage use-detailed-costs costs-granted budget-field]
  (let [only-incomes (not use-detailed-costs)
        budget-field-children (:children budget-field)
        total-row-sum (->> budget-field-children
                           find-summing-fields
                           find-budget-item-elements
                           (sum-budget-items answers only-incomes)
                           (r/fold +))
        total-sum (if use-detailed-costs total-row-sum (+ total-row-sum costs-granted))
        self-financing-amount (select-self-financing-amount answers
                                                            (last budget-field-children)
                                                            self-financing-percentage
                                                            total-sum)
        oph-share (max (- total-sum self-financing-amount) 0)]
    {:total-needed total-sum
     :oph-share oph-share}))

(defn calculate-totals-virkailija [answers avustushaku form use-detailed-costs costs-granted]
  (let [self-financing-percentage (-> avustushaku :content :self-financing-percentage)
        all-budget-summaries (->> (:content form)
                                  formutil/flatten-elements
                                  (filter is-budget-field?)
                                  (map (partial do-calculate-totals answers self-financing-percentage use-detailed-costs costs-granted )))]
    (first all-budget-summaries)))

(defn calculate-totals [answers avustushaku form]
  (calculate-totals-virkailija answers avustushaku form true 0))
