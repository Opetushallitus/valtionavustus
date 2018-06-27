(ns oph.va.admin-ui.components.table
  (:require [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.components.tools :refer [split-component]]
            [oph.va.admin-ui.components.ui :as va-ui]))

(def table-row :tr)

(def table-row-column :td)

(defn table-header [& body]
  (let [{:keys [props children]} (split-component body)]
    [:div
     (update props :style merge theme/table-header)
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

(defn sortable-header-column
  [{:keys [title column-key on-sort on-filter sort-params]}]
  [table-header-column
   [:div
    {:on-click #(on-sort column-key)}
    title (when (= (:sort-key sort-params) column-key)
            [va-ui/arrow
             {:direction (if (:descend? sort-params) :up :down)
              :style {:float "right"}}])]
   [va-ui/text-field
    {:size :small
     :on-change #(on-filter column-key (-> % .-target .-value))}]])
