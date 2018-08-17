(ns oph.va.admin-ui.components.table
  (:require [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.components.tools :refer [split-component]]
            [oph.va.admin-ui.components.ui :as va-ui]
            [reagent.core :as r]))

(def table-row :tr)

(def table-row-column :td)

(defn table-header [& body]
  (let [{:keys [props children]} (split-component body)]
    [:div
     (assoc props :style (merge theme/table-header (:style props)))
     [:table {:width "100%"}
      (apply vector :thead children)]]))

(defn table-header-column [& body]
  (let [{:keys [props children]} (split-component body)]
    (apply vector :th
           (update props :style merge theme/table-header-cell)
           children)))

(defn table-body [& body]
  (let [{:keys [props children]} (split-component body)
        height (get-in props [:style :table-height] 300)]
    [:div {:style (merge {:max-height height} theme/table-body (:style props))}
        [:table {:style {:max-height height :width "100%"}}
         (apply vector :tbody
                {:class (str "va-ui-table-body" (:class props))}
                children)]]))

(defn table-footer [& body]
  (let [{:keys [props children]} (split-component body)]
    [:div
     (update props :style merge theme/table-footer)
     [:table {:width "100%"}
      (apply vector :tfoot children)]]))

(defn table [& body]
  (let [{:keys [props children]} (split-component body)]
    (apply vector
           :div
           (update props :class str " va-ui-table")
           children)))

(defn sortable-header-column [props]
  (let [value (r/atom "")]
    (fn [props]
      (let [{:keys [title column-key on-sort on-filter
                    sort-params field-type]} props]
        [table-header-column
         {:style (merge theme/sortable-header-column (get props :style))}
         [:div
          {:on-click #(on-sort column-key)}
          title (when (= (:sort-key sort-params) column-key)
                  [va-ui/arrow
                   {:direction (if (:descend? sort-params) :up :down)
                    :style {:float "right"}}])]
         (if (= field-type :date)
           [va-ui/date-picker-va
            {:id "title"
             :size :small
             :style theme/sortable-header-column-input
             :value (when (seq @value) @value)
             :on-change #(do (reset! value %) (on-filter column-key %))}]
           [va-ui/text-field
            {:size :small
             :value @value
             :style theme/sortable-header-column-input
             :on-change #(let [v (-> % .-target .-value)]
                           (do (reset! value v)
                               (on-filter
                                 column-key v)))}])]))))
