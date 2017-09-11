(ns oph.soresu.form.formutil-spec
  (:require
    [speclj.core :refer :all]
    [oph.soresu.form.formutil :refer :all]))

(def test-form
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

(def lookup-table
  {#(re-matches #"eu-.*" (:id %)) "Something to do with EU"
   #(= 0 (:initialValue %)) "Field with initial value of zero"})

(defn- find-result [field-id found-mappings]
  (->> found-mappings
       (filter (fn [r] (= field-id (-> r :field :id))))
       first
       :result))

(describe "formutil"

  (tags :server)

  (it "Can look up values for fields by matching lambdas"
      (let [found-mappings (decorate-matching test-form lookup-table)]
        (should= nil (find-result "coordination-costs-row.description" found-mappings))
        (should= "Field with initial value of zero" (find-result "coordination-costs-row.amount" found-mappings))
        (should= "Something to do with EU" (find-result "eu-programs-income-row.amount" found-mappings))
        (should= 8 (count found-mappings))))

  (it "Finds fields with predicate"
      (let [found (map :id (find-fields* #(re-matches #".*-income.*\.amount" (:id %)) (:content test-form)))]
        (should= '("project-incomes-row.amount" "eu-programs-income-row.amount") found))))

(run-specs)
