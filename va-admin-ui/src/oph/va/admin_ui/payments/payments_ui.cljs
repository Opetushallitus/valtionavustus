(ns oph.va.admin-ui.payments.payments-ui
  (:require [reagent.core :as r]
            [cljsjs.material-ui]
            [cljs-react-material-ui.reagent :as ui]
            [cljs-react-material-ui.icons :as ic]
            [oph.va.admin-ui.components.table :as table]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.payments.applications :refer [state-to-str]]
            [oph.va.admin-ui.payments.utils
             :refer [to-simple-date-time to-simple-date]]
            [oph.va.admin-ui.utils :refer [format get-answer-value]]
            [oph.va.admin-ui.components.ui :as va-ui]
            [clojure.string :refer [lower-case]]))

(defn render-history-item [i application]
  [ui/table-row {:key i}
   [ui/table-row-column (to-simple-date-time (:created-at application))]
   [ui/table-row-column (:version application)]
   [ui/table-row-column (state-to-str (:state application))]
   [ui/table-row-column (to-simple-date (:invoice-date application))]
   [ui/table-row-column (to-simple-date (:due-date application))]
   [ui/table-row-column (to-simple-date (:receipt-date application))]
   [ui/table-row-column (:transaction-account application)]
   [ui/table-row-column (:document-type application)]
   [ui/table-row-column (:inspector-email application)]
   [ui/table-row-column (:acceptor-email application)]
   [ui/table-row-column
    (when (:deleted application)
      (to-simple-date-time (:deleted application)))]
   [ui/table-row-column (:user-name application)]])

(defn render-history [payments]
  [ui/table {:fixed-header true :selectable false :height "300px"}
   [ui/table-header {:adjust-for-checkbox false :display-select-all false}
    [ui/table-row [ui/table-header-column "Aika"]
     [ui/table-header-column "Versio"]
     [ui/table-header-column "Tila"]
     [ui/table-header-column "Laskun päivä"]
     [ui/table-header-column "Eräpäivä"]
     [ui/table-header-column "Tositepäivä"]
     [ui/table-header-column "Maksuliikemenotili"]
     [ui/table-header-column "Tositelaji"]
     [ui/table-header-column "Tarkastaja"]
     [ui/table-header-column "Hyväksyjä"]
     [ui/table-header-column "Poistettu"]
     [ui/table-header-column "Käyttäjä"]]]
   [ui/table-body {:display-row-checkbox false}
    (doall (map-indexed render-history-item payments))]])

(defn render-payment [i payment]
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
   [table/table-row-column
    (get-answer-value (:answers payment) "bank-iban")]
   [table/table-row-column (get payment :lkp-account)]
   [table/table-row-column (get payment :takp-account)]
   [table/table-row-column {:style {:text-align "right"}}
    (.toLocaleString (get payment :budget-granted 0)) " €"]])

(defn sort-payments [payments sort-key descend?]
  (if descend?
    (sort-by sort-key payments)
    (reverse (sort-by sort-key payments))))

(defn sort-column! [sort-params sort-key]
  (swap! sort-params assoc
         :sort-key sort-key
         :descend? (not (:descend? @sort-params))))

(defn to-lower-str [v]
  (-> v
      str
      lower-case))

(defn payment-matches? [payment filters]
  (every?
    (fn [[k v]]
      (> (.indexOf (to-lower-str (get payment k)) v) -1))
    filters))

(defn filter-payments [payments filters]
  (filter #(payment-matches? % filters) payments))

(defn update-filters! [filters k v]
  (prn k v)
  (if (empty? v)
    (swap! filters dissoc k)
    (swap! filters assoc k (lower-case v))))

(defn sortable-header-column
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
              (not-empty @filters) (filter-payments @filters)
              (some? (:sort-key @sort-params))
              (sort-payments
                (:sort-key @sort-params) (:descend? @sort-params)))]
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
              :column-key :budget-granted
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]]]
          [table/table-body
           {:style {:padding-right
                    (when (< (count sorted-filtered-payments)) 14)}}
           (doall (map-indexed render-payment sorted-filtered-payments))]
          [table/table-footer
           [table/table-row
            [table/table-row-column]
            [table/table-row-column]
            [table/table-row-column "Yhteensä"]
            [table/table-row-column {:style {:text-align "right"}}
             (.toLocaleString
               (reduce #(+ %1 (:payment-sum %2)) 0 sorted-filtered-payments))
             " €"]
            [table/table-row-column]
            [table/table-row-column]
            [table/table-row-column]
            [table/table-row-column {:style {:text-align "right"}}
             (.toLocaleString
               (reduce #(+ %1 (:budget-granted %2)) 0 sorted-filtered-payments))
             " €"]]]]]))))
