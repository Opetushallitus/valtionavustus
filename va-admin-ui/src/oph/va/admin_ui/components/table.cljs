(ns oph.va.admin-ui.components.table
  (:require [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.utils :refer [fill]]))

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

(defn- default-style [props]
  {:height (get props :height 300)
   :width (get props :width "100%")})

(defn- table-header [{:keys [style overflow?]} cols]
  [:div {:style (assoc theme/table-header
                       :padding-right (when overflow? 14))}
      [:table {:style style}
       [:thead
        [:tr (doall (map-indexed header-cell cols))]]]])

(defn table [props header rows footer]
  (let [column-count (max (count header) (count (first rows)) (count footer))
        overflow? (> (count rows) 6)
        table-style (default-style props)]
    [:div {:class "va-ui-table"}
     [table-header {:style table-style
                    :overflow? overflow?}
      (fill header column-count)]
     (if (empty? rows)
       [:div {:style theme/table-empty-text} (:empty-text props)]
       [:div {:style {:overflow "auto"
                      :max-height (:height table-style)
                      :width (:width table-style)} }
        [:table {:style {:max-height (:height table-style)
                         :width (:width table-style)}}
         [:tbody {:class "va-ui-table-body"}
          (doall (map-indexed row rows))]]])
     [:div {:style {:overflow "hidden" :padding-right (when overflow? 14)}}
      [:table {:style table-style}
       [:tfoot
        [:tr (doall (map-indexed cell (fill footer column-count)))]]]]]))

(defn group-table [{:keys [header content row-renderer footer-renderer]}])
