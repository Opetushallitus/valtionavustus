(ns oph.va.budget_spec
  (:require
    [speclj.core :refer :all]
    [oph.va.budget :refer :all]))

(def form-with-budget-field
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

(def avustushaku {:content { :self-financing-percentage 10 } })

(describe "Budget calculation"

          (tags :server)

          (it "Calculates trivial case correctly"
              (let [totals (oph.va.budget/calculate-totals complete-valid-answers
                                                           avustushaku
                                                           form-with-budget-field)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals))))

          (it "Skips empty fields"
              (let [answers-with-empty-field {:value [
                  {:key "coordination-costs-row.amount" :value "4000"}
                  {:key "personnel-costs-row.amount" :value ""}
                  {:key "project-incomes-row.amount" :value "1500"}
                  {:key "eu-programs-income-row.amount" :value "500"}]}
                    totals (oph.va.budget/calculate-totals answers-with-empty-field avustushaku form-with-budget-field)]
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
                    totals (oph.va.budget/calculate-totals answers-with-empty-field
                                                           avustushaku
                                                           form-with-budget-field)]
                (should= 2000 (:total-needed totals))
                (should= 1800 (:oph-share totals))))

          (it "Calculates corner cases correctly"
                                  (let [answers-with-empty-field {:value [
                                      {:key "coordination-costs-row.amount" :value "10"}
                                      {:key "eu-programs-income-row.amount" :value "1"}]}
                                        totals (oph.va.budget/calculate-totals answers-with-empty-field avustushaku form-with-budget-field)]
                                    (should= 9 (:total-needed totals))
                                    (should= 8 (:oph-share totals)))))

(run-specs)
