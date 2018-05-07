(ns oph.va.admin-ui.components.table
  (:require [oph.va.admin-ui.theme :as theme]))

(defn cell [i content]
  (let [with-props? (and (coll? content)
                         (map? (first content)))
        props (if with-props?
                (assoc (first content) :key i)
                {:key i})
        c (if with-props? (rest content) [content])]
    [:td props (doall (map-indexed #(vector :span {:key %1} %2) c))]))

(defn header-cell [i content]
  [:th {:key i :style {:text-align "left"}} content])

(defn row [i cells]
  [:tr {:key i}
   (doall (map-indexed cell cells))])

(defn column [i content]
  [:th {:key i} content])

(defn table [props header rows]
  [:table {:class "va-ui-table" :style theme/table}
   [:thead
    [:tr (doall (map-indexed header-cell header))]]
   [:tbody
    (doall (map-indexed row rows))]])
