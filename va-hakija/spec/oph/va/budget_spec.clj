(ns oph.va.budget_spec
  (:require
    [speclj.core :refer :all]
    [oph.va.budget :refer :all]))

(def form-with-budget-field
  {:id 1
   :content [{
     :id "financing-plan"
     :type "wrapperElement"
     :children [
        {:id "budget"
         :type "wrapperElement"
         :children [
           {:id "project-budget"
            :type "wrapperElement"
            :children [
              {:id "coordination-costs-row"
               :type "wrapperElement"
               :params {:incrementsTotal true}
               :children [
                 {:id "coordination-costs-row.description"
                  :type "formField"
                  :displayAs "textField"}
                 {:id "coordination-costs-row.amount"
                  :type "formField"
                  :displayAs "moneyField"
                  :initialValue 0}]
               :displayAs "vaBudgetItemElement"}
              {:id "personnel-costs-row"
               :type "wrapperElement"
               :params {:incrementsTotal true}
               :children [
                 {:id "personnel-costs-row.description"
                  :type "formField"
                  :displayAs "textField"}
                 {:id "personnel-costs-row.amount"
                  :type "formField"
                  :displayAs "moneyField"
                  :initialValue 0}]
               :displayAs "vaBudgetItemElement"}
              {:id "project-incomes-row"
               :type "wrapperElement"
               :params {:incrementsTotal false}
               :children [
                 {:id "project-incomes-row.description"
                  :type "formField"
                  :displayAs "textField"}
                 {:id "project-incomes-row.amount"
                  :type "formField"
                  :displayAs "moneyField"
                  :initialValue 0}]
               :displayAs "vaBudgetItemElement"}]
            :displayAs "vaSummingBudgetElement"}
           {:id "third-party-income"
            :type "wrapperElement"
            :children [
              {:id "eu-programs-income-row"
               :type "wrapperElement"
               :params {:incrementsTotal false}
               :children [
                 {:id "eu-programs-income-row.description"
                  :type "formField"
                  :displayAs "textField"}
                 {:id "eu-programs-income-row.amount"
                  :type "formField"
                  :displayAs "moneyField"
                  :initialValue 0}],
               :displayAs "vaBudgetItemElement"}]
            :displayAs "vaSummingBudgetElement"}]
         :displayAs "vaBudget"}]
     :displayAs "theme"}] })

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
          (it "Calculates trivial case correctly"
              (let [totals (oph.va.budget/calculate-totals complete-valid-answers avustushaku form-with-budget-field)]
                (should= 12000 (:total-needed totals))
                (should= 10800 (:oph-share totals)))))

(run-specs)