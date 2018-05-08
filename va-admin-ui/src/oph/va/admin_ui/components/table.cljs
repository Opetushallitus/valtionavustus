(ns oph.va.admin-ui.components.table
  (:require [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.utils :refer [fill]]))

(defn- split-component [body]
  (if (map? (first body))
    {:props (first body)
     :children (rest body)}
    {:props {}
     :children body}))

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
    [:div {:style {:overflow "auto"
                   :max-height height}}
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
