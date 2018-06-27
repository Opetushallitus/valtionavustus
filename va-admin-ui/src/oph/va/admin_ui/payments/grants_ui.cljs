(ns oph.va.admin-ui.payments.grants-ui
  (:require [cljsjs.material-ui]
            [oph.va.admin-ui.components.table :as table]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.payments.utils
             :refer [to-simple-date-time sort-column! update-filters!
                     sort-rows filter-rows]]
            [reagent.core :as r]
            [clojure.string :refer [lower-case]]))

(def ^:private status-strs
  {"resolved" "Ratkaistu"
   "published" "Julkaistu"
   "draft" "Luonnos"
   "deleted" "Poistettu"})

(defn- grant-row [grant selected on-select]
  [table/table-row {:key (:id grant)
                    :on-click #(on-select (:id grant))
                    :style (if selected
                             theme/selected-table-row
                             theme/table-row)}
   [table/table-row-column (get grant :register-number)]
   [table/table-row-column (get-in grant [:content :name :fi])]
   [table/table-row-column (get status-strs (get grant :status))]
   [table/table-row-column
    (to-simple-date-time (get-in grant [:content :duration :start]))]
   [table/table-row-column
    (to-simple-date-time (get-in grant [:content :duration :end]))]])

(defn grants-table [props]
  (let [sort-params (r/atom {:sort-key :name :descend? false})
        filters (r/atom {})]
    (fn [props]
      (let [{:keys [on-change grants value]} props
            filtered-sorted-grants
            (sort-rows
              (filter-rows grants @filters)
              (:sort-key @sort-params)
              (:descend? @sort-params))]
        [table/table
         {:height "250px"}
         [table/table-header
          [table/table-row
           [table/sortable-header-column
            {:title "Diaarinumero"
             :column-key :register-number
             :sort-params @sort-params
             :on-sort #(sort-column! sort-params %)
             :on-filter #(update-filters! filters %1 %2)}]
           [table/sortable-header-column
            {:title "Nimi"
             :column-key :name
             :sort-params @sort-params
             :on-sort #(sort-column! sort-params %)
             :on-filter #(update-filters! filters %1 %2)}]
           [table/sortable-header-column
            {:title "Tila"
             :column-key :status
             :sort-params @sort-params
             :on-sort #(sort-column! sort-params %)
             :on-filter #(update-filters! filters %1 %2)}]
           [table/sortable-header-column
            {:title "Haku alkaa"
             :column-key :start
             :sort-params @sort-params
             :on-sort #(sort-column! sort-params %)
             :on-filter #(update-filters! filters %1 %2)}]
           [table/sortable-header-column
            {:title "Haku päättyy"
             :column-key :end
             :sort-params @sort-params
             :on-sort #(sort-column! sort-params %)
             :on-filter #(update-filters! filters %1 %2)}]]]
         [table/table-body
          (for [grant filtered-sorted-grants]
            (grant-row grant (= value (:id grant)) on-change))]]))))

(defn grant-info [grant]
  [:div
   [:h3 (get-in grant [:content :name :fi])]
   [:div {:style {:display "span" :margin 20}}
    [:div [:label "Toimintayksikkö: "] (:operational-unit grant)]
    [:div [:label "Projekti: "] (:project grant)]
    [:div [:label "Toiminto: "] (:operation grant)]
    [:div [:label "Maksuliikemenotili: "]
     (get-in grant [:content :transaction-account])]
    [:div [:label "Tositelaji: "]
     (get-in grant [:content :document-type])]]])
