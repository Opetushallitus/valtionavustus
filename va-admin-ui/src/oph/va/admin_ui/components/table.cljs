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

(defn default-style [props]
  {:height (get props :height 300)
   :width (get props :width "100%")})

(defn header [{:keys [style overflow?]} cols]
  [:div {:style (assoc theme/table-header
                       :padding-right (when overflow? 14))}
      [:table {:style style}
       [:thead
        [:tr (doall (map-indexed header-cell cols))]]]])

(defn body [{:keys [style class]} rows]
  [:div {:style {:overflow "auto"
                      :max-height (:height style)
                      :width (:width style)} }
        [:table {:style {:max-height (:height style)
                         :width (:width style)}}
         [:tbody {:class class}
          (doall (map-indexed row rows))]]])

(defn footer [{:keys [style overflow?]} content]
  [:div {:style (assoc theme/table-footer
                       :padding-right (when overflow? 14))}
   [:table {:style style}
    [:tfoot
     [:tr (doall (map-indexed cell content))]]]])

(defn table [props header-content body-content footer-content]
  (let [column-count
        (max (count header-content)
             (count (first body-content))
             (count footer-content))
        overflow? (> (count body-content) 6)
        table-style (default-style props)]
    [:div {:class "va-ui-table"}
     [header {:style table-style
                    :overflow? overflow?}
      (fill header-content column-count)]
     (if (and (empty? body-content) (some? (:empty-text props)))
       [:div {:style theme/table-empty-text} (:empty-text props)]
       [body {:class "va-ui-table-body"
                    :style table-style}
        body-content])
     [footer {:style table-style
                    :overflow? overflow?}
      (fill footer-content column-count)]]))
