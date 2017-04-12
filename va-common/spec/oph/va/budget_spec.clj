(ns oph.va.budget-spec
  (:require [speclj.core :refer :all]
            [oph.soresu.form.formutil :refer [transform-form-content]]
            [oph.va.budget :refer :all]))

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

(def budget-form-with-self-financing-amount
  (let [budget-summary {:id         "budget-summary",
                        :fieldClass "wrapperElement",
                        :fieldType  "vaBudgetSummaryElement",
                        :children [{:id        "self-financing-amount",
                                   :fieldClass "formField",
                                   :fieldType  "vaSelfFinancingField"}]}]
    (transform-form-content budget-form
                            (fn [field]
                              (if (= "vaBudget" (:fieldType field))
                                (update field
                                        :children
                                        (fn [children]
                                          (conj children budget-summary)))
                                field)))))

(def budget-form-with-summary-not-last
  (let [others {:id         "others",
                :fieldClass "wrapperElement",
                :fieldType  "fieldset",
                :children   [{:id         "other",
                              :fieldClass "formField",
                              :fieldType  "textField"}]}]
    (transform-form-content budget-form-with-self-financing-amount
                            (fn [field]
                              (if (= "vaBudget" (:fieldType field))
                                (update field
                                        :children
                                        (fn [children]
                                          (conj children others)))
                                field)))))

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

(defn conj-answers [answers answer]
  (update answers :value #(conj % answer)))

(describe "Budget calculation for hakija"

          (tags :server)

          (it "Calculates trivial case correctly"
              (let [totals (oph.va.budget/calculate-totals-hakija complete-valid-answers
                                                                  avustushaku
                                                                  budget-form)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Skips empty fields"
              (let [answers-with-empty-field {:value [{:key "coordination-costs-row.amount" :value "4000"}
                                                      {:key "personnel-costs-row.amount" :value ""}
                                                      {:key "project-incomes-row.amount" :value "1500"}
                                                      {:key "eu-programs-income-row.amount" :value "500"}]}
                    totals (oph.va.budget/calculate-totals-hakija answers-with-empty-field
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
                    totals (oph.va.budget/calculate-totals-hakija answers-with-empty-field
                                                                  avustushaku
                                                                  budget-form)]
                (should= 2000 (:total-needed totals))
                (should= 1800 (:oph-share totals))))

          (it "Calculates corner cases correctly"
              (let [answers-with-empty-field {:value [{:key "coordination-costs-row.amount" :value "10"}
                                                      {:key "eu-programs-income-row.amount" :value "1"}]}
                    totals (oph.va.budget/calculate-totals-hakija answers-with-empty-field
                                                                  avustushaku
                                                                  budget-form)]
                (should= 9 (:total-needed totals))
                (should= 8 (:oph-share totals))))

          (it "Calculates budget with floating self-financing amount"
              (let [totals (oph.va.budget/calculate-totals-hakija (conj-answers complete-valid-answers
                                                                                {:key "self-financing-amount"
                                                                                 :value "2300"})
                                                                  avustushaku
                                                                  budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 9700 (:oph-share totals))))

          (it "Fallbacks to minimum self-financing amount if self-financing amount answer is too small"
              (let [totals (oph.va.budget/calculate-totals-hakija (conj-answers complete-valid-answers
                                                                                {:key "self-financing-amount"
                                                                                 :value "900"})
                                                                  avustushaku
                                                                  budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Fallbacks to minimum self-financing amount if self-financing amount answer is invalid"
              (let [totals (oph.va.budget/calculate-totals-hakija (conj-answers complete-valid-answers
                                                                                {:key "self-financing-amount"
                                                                                 :value "garbage"})
                                                                  avustushaku
                                                                  budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Fallbacks to minimum self-financing amount if there's no self-financing amount answer"
              (let [totals (oph.va.budget/calculate-totals-hakija complete-valid-answers
                                                                  avustushaku
                                                                  budget-form-with-self-financing-amount)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Finds self-financing amount field if budget summary is not last field inside budget field"
              (let [totals (oph.va.budget/calculate-totals-hakija (conj-answers complete-valid-answers
                                                                                {:key "self-financing-amount"
                                                                                 :value "2300"})
                                                                  avustushaku
                                                                  budget-form-with-summary-not-last)]
                (should= 12000 (:total-needed totals))
                (should= 9700 (:oph-share totals))))
)

(describe "Budget calculation for virkailija"

          (tags :server)

          (it "Calculates budget with fixed self-financing percentage and detailed-costs"
              (let [totals (oph.va.budget/calculate-totals-virkailija complete-valid-answers
                                                                      avustushaku
                                                                      budget-form
                                                                      {}
                                                                      true
                                                                      -9999)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Calculates budget with floating self-financing percentage and detailed-costs"
              (let [totals (oph.va.budget/calculate-totals-virkailija complete-valid-answers
                                                                      avustushaku
                                                                      budget-form-with-self-financing-amount
                                                                      {:budget_oph_share 7236
                                                                       :budget_total     10000}
                                                                      true
                                                                      -9999)]
                (should= 12000 (:total-needed totals))
                (should= 8683 (:oph-share totals))))

          (it "Calculates budget with fixed self-financing percentage and granted-costs"
              (let [totals (oph.va.budget/calculate-totals-virkailija complete-valid-answers
                                                                      avustushaku
                                                                      budget-form
                                                                      {}
                                                                      false
                                                                      11200)]
                (should= 9200 (:total-needed totals))
                (should= 8280 (:oph-share totals))))

          (it "Calculates budget with floating self-financing percentage and granted-costs"
              (let [totals (oph.va.budget/calculate-totals-virkailija complete-valid-answers
                                                                      avustushaku
                                                                      budget-form-with-self-financing-amount
                                                                      {:budget_oph_share 7267
                                                                       :budget_total     10000}
                                                                      false
                                                                      11200)]
                (should= 9200 (:total-needed totals))
                (should= 6685 (:oph-share totals)))))

(run-specs)
