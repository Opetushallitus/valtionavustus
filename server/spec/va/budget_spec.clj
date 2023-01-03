(ns oph.va.budget-spec
  (:require [speclj.core :refer :all]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.budget :as va-budget]))

(defn- transform-budget-children [budget-form transform-fn]
  (formutil/transform-form-content budget-form
                                   (fn [field]
                                     (if (= "vaBudget" (:fieldType field))
                                       (update field :children transform-fn)
                                       field))))

(defn- conj-answers [answers answer]
  (update answers :value #(conj % answer)))

(def budget-form
  {:id 1
   :content [{
     :id "financing-plan"
     :fieldClass "wrapperElement"
     :children [
        {:id "budget"
         :fieldClass "wrapperElement"
         :children [
           {:id "project-budget"
            :fieldClass "wrapperElement"
            :children [
              {:id "coordination-costs-row"
               :fieldClass "wrapperElement"
               :params {:incrementsTotal true}
               :children [
                 {:id "coordination-costs-row.description"
                  :fieldClass "formField"
                  :fieldType "textField"}
                 {:id "coordination-costs-row.amount"
                  :fieldClass "formField"
                  :fieldType "moneyField"
                  :initialValue 0}]
               :fieldType "vaBudgetItemElement"}
              {:id "personnel-costs-row"
               :fieldClass "wrapperElement"
               :params {:incrementsTotal true}
               :children [
                 {:id "personnel-costs-row.description"
                  :fieldClass "formField"
                  :fieldType "textField"}
                 {:id "personnel-costs-row.amount"
                  :fieldClass "formField"
                  :fieldType "moneyField"
                  :initialValue 0}]
               :fieldType "vaBudgetItemElement"}
              {:id "project-incomes-row"
               :fieldClass "wrapperElement"
               :params {:incrementsTotal false}
               :children [
                 {:id "project-incomes-row.description"
                  :fieldClass "formField"
                  :fieldType "textField"}
                 {:id "project-incomes-row.amount"
                  :fieldClass "formField"
                  :fieldType "moneyField"
                  :initialValue 0}]
               :fieldType "vaBudgetItemElement"}]
            :fieldType "vaSummingBudgetElement"}
           {:id "third-party-income"
            :fieldClass "wrapperElement"
            :children [
              {:id "eu-programs-income-row"
               :fieldClass "wrapperElement"
               :params {:incrementsTotal false}
               :children [
                 {:id "eu-programs-income-row.description"
                  :fieldClass "formField"
                  :fieldType "textField"}
                 {:id "eu-programs-income-row.amount"
                  :fieldClass "formField"
                  :fieldType "moneyField"
                  :initialValue 0}],
               :fieldType "vaBudgetItemElement"}]
            :fieldType "vaSummingBudgetElement"}]
         :fieldType "vaBudget"}]
     :fieldType "theme"}] })

(def budget-summary-element
  {:id         "budget-summary"
   :fieldClass "wrapperElement"
   :fieldType  "vaBudgetSummaryElement"})

(def budget-form-with-summary
  (transform-budget-children budget-form
                             (fn [children]
                               (conj children budget-summary-element))))

(def budget-form-with-self-financing-amount
  (let [budget-summary (assoc budget-summary-element
                              :children
                              [{:id         "self-financing-amount"
                                :fieldClass "formField"
                                :fieldType  "vaSelfFinancingField"}])]
    (transform-budget-children budget-form
                               (fn [children]
                                 (conj children budget-summary)))))

(def complete-valid-answers
  {:value [
    {:key "continuation-project" :value "yes"}
    {:key "vat-included" :value "yes"}
    {:key "coordination-costs-row.amount" :value "4000"}
    {:key "personnel-costs-row.amount" :value "10000"}
    {:key "project-incomes-row.amount" :value "1500"}
    {:key "eu-programs-income-row.amount" :value "500"}
    {:key "coordination-costs-row.description" :value "Koordinaatiopalaverit"}
    {:key "personnel-costs-row.description" :value "Palkat ja palkkiot"}
    {:key "project-incomes-row.description" :value "Lipunmyynti"}
    {:key "eu-programs-income-row.description" :value "Vuoristoalueiden kehitysrahasto"}
    {:key "organization" :value "Testiorganisaatio"}]})

(def avustushaku {:content {:self-financing-percentage 10}})

(describe "Budget calculation for hakija"

          (tags :budget)

          (it "Calculates trivial case correctly"
              (let [totals (va-budget/calculate-totals-hakija complete-valid-answers
                                                              avustushaku
                                                              budget-form)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Skips empty fields"
              (let [answers-with-empty-field {:value [{:key "coordination-costs-row.amount" :value "4000"}
                                                      {:key "personnel-costs-row.amount" :value ""}
                                                      {:key "project-incomes-row.amount" :value "1500"}
                                                      {:key "eu-programs-income-row.amount" :value "500"}]}
                    totals (va-budget/calculate-totals-hakija answers-with-empty-field
                                                              avustushaku
                                                              budget-form)]
                (should= 2000 (:total-needed totals))
                (should= 1800 (:oph-share totals))))

          (it "Skips non-numeric fields"
              (let [answers-with-empty-field {:value [{:key "coordination-costs-row.amount"
                                                       :value "4000"}
                                                      {:key "personnel-costs-row.amount"
                                                       :value "invalid"}
                                                      {:key "project-incomes-row.amount"
                                                       :value "1500"}
                                                      {:key "eu-programs-income-row.amount"
                                                       :value "500"}]}
                    totals (va-budget/calculate-totals-hakija answers-with-empty-field
                                                              avustushaku
                                                              budget-form)]
                (should= 2000 (:total-needed totals))
                (should= 1800 (:oph-share totals))))

          (it "Calculates corner cases correctly"
              (let [answers-with-empty-field {:value [{:key "coordination-costs-row.amount" :value "10"}
                                                      {:key "eu-programs-income-row.amount" :value "1"}]}
                    totals (va-budget/calculate-totals-hakija answers-with-empty-field
                                                              avustushaku
                                                              budget-form)]
                (should= 9 (:total-needed totals))
                (should= 8 (:oph-share totals))))

          (it "Returns zero OPH share if budget is negative"
              (let [answers {:value [{:key "coordination-costs-row.amount" :value "1000"}
                                     {:key "eu-programs-income-row.amount" :value "1100"}]}
                    totals (va-budget/calculate-totals-hakija answers
                                                              avustushaku
                                                              budget-form)]
                (should= -100 (:total-needed totals))
                (should= 0 (:oph-share totals))))

          (it "Calculates budget with floating self-financing amount"
              (let [totals (va-budget/calculate-totals-hakija (conj-answers complete-valid-answers
                                                                            {:key "self-financing-amount"
                                                                             :value "2300"})
                                                              avustushaku
                                                              budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 9700 (:oph-share totals))))

          (it "Fallbacks to minimum self-financing amount if self-financing amount answer is too small"
              (let [totals (va-budget/calculate-totals-hakija (conj-answers complete-valid-answers
                                                                            {:key "self-financing-amount"
                                                                             :value "900"})
                                                              avustushaku
                                                              budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Fallbacks to minimum self-financing amount if self-financing amount answer is invalid"
              (let [totals (va-budget/calculate-totals-hakija (conj-answers complete-valid-answers
                                                                            {:key "self-financing-amount"
                                                                             :value "garbage"})
                                                              avustushaku
                                                              budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Fallbacks to minimum self-financing amount if there's no self-financing amount answer"
              (let [totals (va-budget/calculate-totals-hakija complete-valid-answers
                                                              avustushaku
                                                              budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Finds self-financing amount field if budget summary is not last field inside budget field"
              (let [other-field {:id         "others"
                                 :fieldClass "wrapperElement"
                                 :fieldType  "fieldset"
                                 :children   [{:id         "other"
                                               :fieldClass "formField"
                                               :fieldType  "textField"}]}
                    form        (transform-budget-children budget-form-with-self-financing-amount
                                                           (fn [children]
                                                             (conj children other-field)))
                    totals      (va-budget/calculate-totals-hakija (conj-answers complete-valid-answers
                                                                            {:key "self-financing-amount"
                                                                             :value "2300"})
                                                              avustushaku
                                                              form)]
                (should= 12000 (:total-needed totals))
                (should= 9700 (:oph-share totals)))))

(describe "Budget calculation for virkailija"

          (tags :budget)

          (it "Calculates budget with fixed self-financing percentage and detailed-costs"
              (let [totals (va-budget/calculate-totals-virkailija complete-valid-answers
                                                                  avustushaku
                                                                  budget-form
                                                                  {}
                                                                  true
                                                                  -9999)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Calculates budget with floating self-financing percentage and detailed-costs"
              (let [totals (va-budget/calculate-totals-virkailija complete-valid-answers
                                                                  avustushaku
                                                                  budget-form-with-self-financing-amount
                                                                  {:budget_oph_share 7236
                                                                   :budget_total     10000}
                                                                  true
                                                                  -9999)]
                (should= 12000 (:total-needed totals))
                (should= 8683 (:oph-share totals))))

          (it "Calculates budget with fixed self-financing percentage and granted-costs"
              (let [totals (va-budget/calculate-totals-virkailija complete-valid-answers
                                                                  avustushaku
                                                                  budget-form
                                                                  {}
                                                                  false
                                                                  11200)]
                (should= 9200 (:total-needed totals))
                (should= 8280 (:oph-share totals))))

          (it "Calculates budget with floating self-financing percentage and granted-costs"
              (let [totals (va-budget/calculate-totals-virkailija complete-valid-answers
                                                                  avustushaku
                                                                  budget-form-with-self-financing-amount
                                                                  {:budget_oph_share 7267
                                                                   :budget_total     10000}
                                                                  false
                                                                  11200)]
                (should= 9200 (:total-needed totals))
                (should= 6685 (:oph-share totals)))))

(describe "Budget validation for hakija"

          (tags :budget :validation)

          (it "Returns empty map for valid answers for form without budget"
              (let [form       {:content []}
                    totals     (va-budget/calculate-totals-hakija complete-valid-answers
                                                                  avustushaku
                                                                  form)
                    validation (va-budget/validate-budget-hakija complete-valid-answers
                                                                 totals
                                                                 form)]
                (should= nil totals)
                (should= {} validation)))

          (it "Validates valid answers for budget with summary with success"
              (let [totals     (va-budget/calculate-totals-hakija complete-valid-answers
                                                                  avustushaku
                                                                  budget-form-with-summary)
                    validation (va-budget/validate-budget-hakija complete-valid-answers
                                                                 totals
                                                                 budget-form-with-summary)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))
                (should= {:budget []} validation)))

          (it "Validates empty answers for budget with summary with failure"
              (let [empty-answers {:value []}
                    totals        (va-budget/calculate-totals-hakija empty-answers
                                                                     avustushaku
                                                                     budget-form-with-summary)
                    validation    (va-budget/validate-budget-hakija empty-answers
                                                                    totals
                                                                    budget-form-with-summary)]
                (should= 0 (:total-needed totals))
                (should= 0 (:oph-share totals))
                (should= {:budget [{:error "negative-budget"}]} validation)))

          (it "Validates answers with negative budget total for budget with summary with failure"
              (let [answers       {:value [{:key "personnel-costs-row.amount" :value "1000"}
                                           {:key "project-incomes-row.amount" :value "1001"}]}
                    totals        (va-budget/calculate-totals-hakija answers
                                                                     avustushaku
                                                                     budget-form-with-summary)
                    validation    (va-budget/validate-budget-hakija answers
                                                                    totals
                                                                    budget-form-with-summary)]
                (should= -1 (:total-needed totals))
                (should= 0 (:oph-share totals))
                (should= {:budget [{:error "negative-budget"}]} validation)))

          (it "Validates answers with zero budget total for budget with summary with failure"
              (let [answers       {:value [{:key "personnel-costs-row.amount" :value "1000"}
                                           {:key "project-incomes-row.amount" :value "1000"}]}
                    totals        (va-budget/calculate-totals-hakija answers
                                                                     avustushaku
                                                                     budget-form-with-summary)
                    validation    (va-budget/validate-budget-hakija answers
                                                                    totals
                                                                    budget-form-with-summary)]
                (should= 0 (:total-needed totals))
                (should= 0 (:oph-share totals))
                (should= {:budget [{:error "negative-budget"}]} validation)))

          (it "Skips negative-budget validation for answers with negative budget total if budget has no summary"
              (let [answers       {:value [{:key "personnel-costs-row.amount" :value "1000"}
                                           {:key "project-incomes-row.amount" :value "1001"}]}
                    totals        (va-budget/calculate-totals-hakija answers
                                                                     avustushaku
                                                                     budget-form)
                    validation    (va-budget/validate-budget-hakija answers
                                                                    totals
                                                                    budget-form)]
                (should= -1 (:total-needed totals))
                (should= 0 (:oph-share totals))
                (should= {:budget []} validation)))

          (it "Skips negative-budget validation for answers with zero budget total if budget has no summary"
              (let [answers       {:value []}
                    totals        (va-budget/calculate-totals-hakija answers
                                                                     avustushaku
                                                                     budget-form)
                    validation    (va-budget/validate-budget-hakija answers
                                                                    totals
                                                                    budget-form)]
                (should= 0 (:total-needed totals))
                (should= 0 (:oph-share totals))
                (should= {:budget []} validation)))

          (it "Validates answers with self-financing amount greater than minimum self-financing with success"
              (let [answers    (conj-answers complete-valid-answers
                                             {:key "self-financing-amount"
                                              :value "1600"})
                    totals     (va-budget/calculate-totals-hakija answers
                                                                  avustushaku
                                                                  budget-form-with-self-financing-amount)
                    validation (va-budget/validate-budget-hakija answers
                                                                 totals
                                                                 budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 10400 (:oph-share totals))
                (should= {:budget []} validation)))

          (it "Validates answers with self-financing amount equal to minimum self-financing with success"
              (let [answers    (conj-answers complete-valid-answers
                                             {:key "self-financing-amount"
                                              :value "1200"})
                    totals     (va-budget/calculate-totals-hakija answers
                                                                  avustushaku
                                                                  budget-form-with-self-financing-amount)
                    validation (va-budget/validate-budget-hakija answers
                                                                 totals
                                                                 budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))
                (should= {:budget []} validation)))

          (it "Validates answers with self-financing amount less than minimum self-financing with failure"
              (let [answers    (conj-answers complete-valid-answers
                                             {:key "self-financing-amount"
                                              :value "800"})
                    totals     (va-budget/calculate-totals-hakija answers
                                                                  avustushaku
                                                                  budget-form-with-self-financing-amount)
                    validation (va-budget/validate-budget-hakija answers
                                                                 totals
                                                                 budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))
                (should= {:budget [{:error "insufficient-self-financing"}]} validation)))

          (it "Validates answers with missing self-financing amount with failure"
              (let [totals     (va-budget/calculate-totals-hakija complete-valid-answers
                                                                  avustushaku
                                                                  budget-form-with-self-financing-amount)
                    validation (va-budget/validate-budget-hakija complete-valid-answers
                                                                 totals
                                                                 budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))
                (should= {:budget [{:error "insufficient-self-financing"}]} validation)))

          (it "Skips self-financing validation if budget is negative"
              (let [answers       {:value []}
                    totals        (va-budget/calculate-totals-hakija answers
                                                                     avustushaku
                                                                     budget-form-with-self-financing-amount)
                    validation    (va-budget/validate-budget-hakija answers
                                                                    totals
                                                                    budget-form-with-self-financing-amount)]
                (should= {:budget [{:error "negative-budget"}]} validation))))

(run-specs)
