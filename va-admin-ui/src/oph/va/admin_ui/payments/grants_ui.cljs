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
   [table/table-row-column
    {:style theme/semi-narrow-column}
    (:register-number grant)]
   [table/table-row-column (:name grant)]
   [table/table-row-column
    {:style theme/semi-narrow-column}
    (:status grant)]
   [table/table-row-column
    {:style theme/semi-narrow-column}
    (f/unparse-local date-time-formatter (:start grant))]
   [table/table-row-column
    {:style theme/semi-narrow-column}
    (f/unparse-local date-time-formatter (:end grant))]])

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

(defn sort-grant-rows [rows sort-key descend?]
  (if (or (= sort-key :start) (= sort-key :end))
    (if descend?
      (sort-by sort-key t/before? rows)
      (sort-by sort-key t/after? rows))
    (sort-rows rows sort-key descend?)))

(defn grants-table [props]
  (let [sort-params (r/atom {:sort-key nil :descend? true})
        filters (r/atom {})]
    (fn [props]
      (let [{:keys [on-change grants value]} props
            filtered-sorted-grants
            (if (some? (:sort-key @sort-params))
              (sort-grant-rows
                (filter-rows grants @filters)
                (:sort-key @sort-params)
                (:descend? @sort-params))
              (filter-rows grants @filters))]
        [table/table
         {:height "250px"
          :style theme/grants-table
          :class "grants-table"}
         [table/table-header
          {:style theme/grants-table-header}
          [table/table-row
           [table/sortable-header-column
            {:title "Diaarinumero"
             :column-key :register-number
             :style theme/semi-narrow-column
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
             :style theme/semi-narrow-column
             :sort-params @sort-params
             :on-sort #(sort-column! sort-params %)
             :on-filter #(update-filters! filters %1 %2)}]
           [table/sortable-header-column
            {:title "Haku alkaa"
             :column-key :start
             :style theme/semi-narrow-column
             :field-type :date
             :sort-params @sort-params
             :on-sort #(sort-column! sort-params %)
             :on-filter #(update-date-filters! filters %1 (f/parse %2))}]
           [table/sortable-header-column
            {:title "Haku päättyy"
             :column-key :end
             :style theme/semi-narrow-column
             :field-type :date
             :sort-params @sort-params
             :on-sort #(sort-column! sort-params %)
             :on-filter #(update-date-filters! filters %1 (f/parse %2))}]]]
         [table/table-body
          (for [grant filtered-sorted-grants]
            (grant-row grant (= value (:id grant)) on-change))]
         [table/table-footer
      [table/table-row
       [table/table-row-column
        {:style (merge theme/semi-narrow-column theme/total-column)}
        (str (count filtered-sorted-grants) "/" (count grants) " hakua")]
       [table/table-row-column]
       [table/table-row-column
        {:style theme/semi-narrow-column}]
       [table/table-row-column
        {:style theme/semi-narrow-column}]
       [table/table-row-column
        {:style theme/semi-narrow-column}]]]]))))

(defn grant-info [grant]
  [:div
   [:h3 (get-in grant [:content :name :fi])]
   [:div {:style {:display "flex" :margin 20}}
    [:div {:style theme/grant-info-item}
     [:label {:style theme/info-label} "Toimintayksikkö"]
     [:div (:operational-unit grant)]]
    [:div {:style theme/grant-info-item}
     [:label {:style theme/info-label} "Projekti"]
     [:div (:project grant)]]
    [:div {:style theme/grant-info-item}
     [:label {:style theme/info-label} "Toiminto"]
     [:div (:operation grant)]]
    [:div {:style theme/grant-info-item}
     [:label {:style theme/info-label} "Maksuliikemenotili"]
     [:div (get-in grant [:content :transaction-account])]]
    [:div {:style theme/grant-info-item}
     [:label {:style theme/info-label} "Tositelaji"]
     [:div (get-in grant [:content :document-type])]]]])
