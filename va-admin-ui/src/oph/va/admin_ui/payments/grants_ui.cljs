(ns oph.va.admin-ui.payments.grants-ui
  (:require [cljsjs.material-ui]
            [oph.va.admin-ui.components.table :as table]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.payments.utils
             :refer [date-time-formatter sort-column! to-lower-str sort-rows
                     update-filters!]]
            [reagent.core :as r]
            [clojure.string :refer [lower-case]]
            [cljs-time.format :as f]
            [cljs-time.core :as t]))

(defn- grant-row [grant selected on-select]
  [table/table-row {:key (:id grant)
                    :on-click #(on-select (:id grant))
                    :style (if selected
                             theme/selected-table-row
                             theme/table-row)}
   [table/table-row-column (:register-number grant)]
   [table/table-row-column (:name grant)]
   [table/table-row-column (:status grant)]
   [table/table-row-column (f/unparse-local date-time-formatter (:start grant))]
   [table/table-row-column (f/unparse-local date-time-formatter (:end grant))]])

(defn- same-day? [d1 d2]
  (and (= (t/year d1) (t/year d2))
       (= (t/month d1) (t/month d2))
       (= (t/day d1) (t/day d2))))

(defn- row-matches-key? [row filters]
  (every?
    (fn [[k v]]
      (if (or (= k :start) (= k :end))
        (same-day? v (get row k))
        (> (.indexOf (to-lower-str (get row k)) v) -1)))
    filters))

(defn filter-rows [rows filters]
  (filter #(row-matches-key? % filters) rows))

(defn update-date-filters! [filters k v]
  (if (nil? v)
    (swap! filters dissoc k)
    (swap! filters assoc k v)))

(defn grants-table [props]
  (let [sort-params (r/atom {:sort-key nil :descend? true})
        filters (r/atom {})]
    (fn [props]
      (let [{:keys [on-change grants value]} props
            filtered-sorted-grants
            (if (some? (:sort-key @sort-params))
              (sort-rows
                (filter-rows grants @filters)
                (:sort-key @sort-params)
                (:descend? @sort-params))
              (filter-rows grants @filters))]
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
             :field-type :date
             :sort-params @sort-params
             :on-sort #(sort-column! sort-params %)
             :on-filter #(update-date-filters! filters %1 (f/parse %2))}]
           [table/sortable-header-column
            {:title "Haku päättyy"
             :column-key :end
             :field-type :date
             :sort-params @sort-params
             :on-sort #(sort-column! sort-params %)
             :on-filter #(update-date-filters! filters %1 (f/parse %2))}]]]
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
