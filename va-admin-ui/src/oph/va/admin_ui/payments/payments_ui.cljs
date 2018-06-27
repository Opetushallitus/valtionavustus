(ns oph.va.admin-ui.payments.payments-ui
  (:require [reagent.core :as r]
            [cljsjs.material-ui]
            [oph.va.admin-ui.components.table :as table]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.utils :refer [format]]
            [oph.va.admin-ui.payments.utils
             :refer [phase-to-name sort-column! update-filters!
                     sort-rows filter-rows]]
            [oph.va.admin-ui.components.ui :as va-ui]))

(defn- render-payment [i payment]
  [table/table-row {:key i}
   [table/table-row-column {:style {:text-align "right"}}
    (:register-number payment)]
   [table/table-row-column {:title (:organization-name payment)}
    (:organization-name payment)]
   [table/table-row-column
    [:a
     {:target "_blank"
      :title (:project-name payment)
      :href (format "/avustushaku/%d/hakemus/%d/arviointi/"
                    (:grant-id payment)
                    (:application-id payment))}
     (:project-name payment)]]
   [table/table-row-column {:style {:text-align "right"}}
    (.toLocaleString (get payment :payment-sum 0)) " €"]
   [table/table-row-column (:bank-iban payment)    ]
   [table/table-row-column (get payment :lkp-account)]
   [table/table-row-column (get payment :takp-account)]
   [table/table-row-column {:style {:text-align "right"}}
    (.toLocaleString (get payment :payment-sum 0)) " €"]])

(defn- render-payment-group [i [phase payments] filters]
  (let [filtered-payments (filter-rows payments filters)]
    [:div {:key i :style {:padding-bottom 10}}
     [:label (phase-to-name phase)]
     [table/table-body
      {:style {:border-top "1px solid #f6f4f0"
               :border-bottom "1px solid #f6f4f0"
               :padding-right (when (< (count payments) 14) 14)}}
      (doall (map-indexed render-payment filtered-payments))]
     [table/table-footer
      [table/table-row
       [table/table-row-column
        (str (count filtered-payments) "/" (count payments) " maksatusta")]
       [table/table-row-column]
       [table/table-row-column "Yhteensä"]
       [table/table-row-column {:style {:text-align "right"}}
        (.toLocaleString
          (reduce #(+ %1 (:payment-sum %2)) 0 filtered-payments))
        " €"]
       [table/table-row-column]
       [table/table-row-column]
       [table/table-row-column]
       [table/table-row-column {:style {:text-align "right"}}
        (.toLocaleString
          (reduce #(+ %1 (get %2 :payment-sum 0)) 0 filtered-payments))
        " €"]]]]))

(defn payments-table [payments]
  (let [sort-params (r/atom {:sort-key nil :descend? false})
        filters (r/atom {})]
    (fn [payments]
      (let [sorted-filtered-payments
            (cond-> payments
              (some? (:sort-key @sort-params))
              (sort-rows
                (:sort-key @sort-params) (:descend? @sort-params)))
            grouped-payments (group-by :phase sorted-filtered-payments)]
        [:div
         [table/table
          [table/table-header
           [table/table-row
            [table/sortable-header-column
             {:title "Pitkäviite"
              :column-key :register-number
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Toimittajan nimi"
              :column-key :organization-name
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Hanke"
              :column-key :project-name
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Maksuun"
              :column-key :payment-sum
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Pankkitilin IBAN"
              :column-key :bank-iban
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "LKP-tili"
              :column-key :lkp-account
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "TaKp-tili"
              :column-key :takp-account
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Tiliöinti"
              :column-key :budget-granted
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]]]

          [:div {:style {:padding-right
                      (when (< (count sorted-filtered-payments)) 14)}}
           (if (empty? sorted-filtered-payments)
             [:div {:style theme/table-empty-text} "Ei maksatuksia"]
             (doall (map-indexed
                      #(render-payment-group %1 %2 @filters)
                      grouped-payments)))]]]))))
