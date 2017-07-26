(ns oph.va.budget
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.common.math :as math]
            [oph.soresu.form.formutil :as formutil]
            [clojure.core.reducers :as r]))

(defn amount-field-of [budget-item]
  (nth (:children budget-item) 1))

(defn read-amount [budget-item answers]
  (let [raw-answer-value (formutil/find-answer-value answers (:id (amount-field-of budget-item)))
        numeric-value (math/parse-integer raw-answer-value)]
    numeric-value))

(defn read-amount-income [budget-item answers only-incomes]
  (let [numeric-value (read-amount budget-item answers)
        increments-total (-> budget-item :params :incrementsTotal)
        coefficient (if increments-total (if only-incomes 0 1) -1)]
    (* coefficient numeric-value)))

(defn find-budget-fields [children]
  (->> children
       formutil/flatten-elements
       (filter (partial formutil/has-field-type? "vaBudget"))))

(defn find-summing-fields [children]
  (-> (partial formutil/has-field-type? "vaSummingBudgetElement")
      (filter children)))

(defn- find-budget-summary-field [budget-field-children]
  (->> budget-field-children
       (filter (partial formutil/has-field-type? "vaBudgetSummaryElement"))
       first))

(defn find-self-financing-field [budget-field-children]
  (if-some [budget-summary-field (find-budget-summary-field budget-field-children)]
    (some->> (:children budget-summary-field)
             (formutil/find-fields* (partial formutil/has-field-type? "vaSelfFinancingField"))
             first)))

(defn- find-budget-item-elements [children]
  (-> (fn [summing-field] (:children summing-field))
      (map children)
      flatten))

(defn- sum-budget-items [answers only-incomes children]
  (-> (fn [item] (read-amount-income item answers only-incomes))
      (map children)))

(defn- share-rounded-up-of [ratio total]
  (-> ratio
      (* total)
      Math/ceil
      int))

(defn- percentage-share-rounded-up-of [percentage total]
  (share-rounded-up-of (/ percentage 100) total))

(defn- find-self-financing-answer-value [answers self-financing-field]
  (let [self-financing-field-id (:id self-financing-field)]
    (math/parse-integer (formutil/find-answer-value answers self-financing-field-id))))

(defn- select-self-financing-amount-virkailija [hakemus self-financing-percentage total-sum budget-field-children _]
  (if (:id (find-self-financing-field budget-field-children))
    (let [hakemus-oph-share (:budget_oph_share hakemus)
          hakemus-total (:budget_total hakemus)
          user-self-financing-ratio (/ (- hakemus-total hakemus-oph-share) hakemus-total)]
        (share-rounded-up-of user-self-financing-ratio total-sum))
    (percentage-share-rounded-up-of self-financing-percentage total-sum)))

(defn- select-self-financing-amount-hakija [self-financing-percentage total-sum budget-field-children answers]
  (let [min-self-financing-amount (percentage-share-rounded-up-of self-financing-percentage total-sum)]
    (if-some [self-financing-field (find-self-financing-field budget-field-children)]
      (let [self-financing-amount (find-self-financing-answer-value answers self-financing-field)]
        (max self-financing-amount min-self-financing-amount))
      min-self-financing-amount)))

(defn- do-calculate-totals [answers
                            use-detailed-costs
                            costs-granted
                            select-self-financing-fn
                            budget-field]
  (let [only-incomes (not use-detailed-costs)
        budget-field-children (:children budget-field)
        total-row-sum (->> budget-field-children
                           find-summing-fields
                           find-budget-item-elements
                           (sum-budget-items answers only-incomes)
                           (r/fold +))
        total-sum (if use-detailed-costs total-row-sum (+ total-row-sum costs-granted))
        self-financing-amount (select-self-financing-fn total-sum
                                                        budget-field-children
                                                        answers)
        oph-share (max (- total-sum self-financing-amount) 0)]
    {:total-needed total-sum
     :oph-share oph-share}))

(defn- calculate-totals [answers avustushaku form use-detailed-costs costs-granted select-self-financing-fn]
  (let [self-financing-percentage (-> avustushaku :content :self-financing-percentage)
        all-budget-summaries (->> (:content form)
                                  (find-budget-fields)
                                  (map (partial do-calculate-totals
                                                answers
                                                use-detailed-costs
                                                costs-granted
                                                (partial select-self-financing-fn self-financing-percentage))))]
    (first all-budget-summaries)))

(defn calculate-totals-virkailija [answers avustushaku form hakemus use-detailed-costs costs-granted]
  (calculate-totals answers
                    avustushaku
                    form
                    use-detailed-costs
                    costs-granted
                    (partial select-self-financing-amount-virkailija hakemus)))

(defn calculate-totals-hakija [answers avustushaku form]
  (calculate-totals answers
                    avustushaku
                    form
                    true
                    0
                    select-self-financing-amount-hakija))

(defn- validate-total-needed-is-positive [budget-totals]
  (if (<= (:total-needed budget-totals) 0)
    [{:error "negative-budget"}]
    []))

(defn- validate-self-financing-is-sufficient [answers budget-field budget-totals]
  (let [total-needed (:total-needed budget-totals)
        valid-result []]
    (if (> total-needed 0)
      (if-some [self-financing-field (find-self-financing-field (:children budget-field))]
        (let [oph-share               (:oph-share budget-totals)
              self-financing-amount   (find-self-financing-answer-value answers self-financing-field)
              expected-self-financing (- total-needed oph-share)]
          (if (< self-financing-amount expected-self-financing)
            [{:error "insufficient-self-financing"}]
            valid-result))
        valid-result)
      valid-result)))

(defn validate-budget-hakija [answers budget-totals form]
  (if-some [budget-field (some-> (:content form)
                                 find-budget-fields
                                 first)]
    (let [field-id (keyword (:id budget-field))]
      (if (find-budget-summary-field (:children budget-field))
        {field-id (concat (validate-total-needed-is-positive budget-totals)
                          (validate-self-financing-is-sufficient answers budget-field budget-totals))}
        {field-id []}))
    {}))
