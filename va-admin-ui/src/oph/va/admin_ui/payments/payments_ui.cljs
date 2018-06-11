(ns oph.va.admin-ui.payments.payments-ui
  (:require [reagent.core :as r]
            [cljsjs.material-ui]
            [oph.va.admin-ui.components.table :as table]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.utils :refer [format]]
            [oph.va.admin-ui.payments.utils :refer [phase-to-name]]
            [oph.va.admin-ui.components.ui :as va-ui]
            [clojure.string :refer [lower-case]]))

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
    (.toLocaleString (get payment :budget-oph-share 0)) " €"]])

(defn- sort-payments [payments sort-key descend?]
  (if descend?
    (sort-by sort-key payments)
    (reverse (sort-by sort-key payments))))

(defn- sort-column! [sort-params sort-key]
  (swap! sort-params assoc
         :sort-key sort-key
         :descend? (not (:descend? @sort-params))))

(defn- to-lower-str [v]
  (-> v
      str
      lower-case))

(defn- payment-matches? [payment filters]
  (every?
    (fn [[k v]]
      (> (.indexOf (to-lower-str (get payment k)) v) -1))
    filters))

(defn- filter-payments [payments filters]
  (filter #(payment-matches? % filters) payments))

(defn- update-filters! [filters k v]
  (if (empty? v)
    (swap! filters dissoc k)
    (swap! filters assoc k (lower-case v))))

(defn- render-payment-group [i [phase payments] filters]
  (let [filtered-payments (filter-payments payments filters)]
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
          (reduce #(+ %1 (get %2 :budget-oph-share 0)) 0 filtered-payments))
        " €"]]]]))

(defn- sortable-header-column
  [{:keys [title column-key on-sort on-filter sort-params]}]
  [table/table-header-column
   [:div
    {:on-click #(on-sort column-key)}
    title (when (= (:sort-key sort-params) column-key)
            [va-ui/arrow
             {:direction (if (:descend? sort-params) :up :down)
              :style {:float "right"}}])]
   [va-ui/text-field
    {:size :small
     :on-change #(on-filter column-key (-> % .-target .-value))}]])

(defn payments-table [payments]
  (let [sort-params (r/atom {:sort-key nil :descend? false})
        filters (r/atom {})]
    (fn [payments]
      (let [sorted-filtered-payments
            (cond-> payments
              (some? (:sort-key @sort-params))
              (sort-payments
                (:sort-key @sort-params) (:descend? @sort-params)))
            grouped-payments (group-by :phase sorted-filtered-payments)]
        [:div
         [table/table
          [table/table-header
           [table/table-row
            [sortable-header-column
             {:title "Pitkäviite"
              :column-key :register-number
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [sortable-header-column
             {:title "Toimittajan nimi"
              :column-key :organization-name
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [sortable-header-column
             {:title "Hanke"
              :column-key :project-name
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [sortable-header-column
             {:title "Maksuun"
              :column-key :payment-sum
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [sortable-header-column
             {:title "Pankkitilin IBAN"
              :column-key :bank-iban
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [sortable-header-column
             {:title "LKP-tili"
              :column-key :lkp-account
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [sortable-header-column
             {:title "TaKp-tili"
              :column-key :takp-account
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [sortable-header-column
             {:title "Tiliöinti"
              :column-key :budget-oph-share
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
