(ns oph.va.admin-ui.components.ui
  (:require [clojure.string :as string]
            [reagent.core :as r]
            [cljsjs.material-ui]
            [cljs-react-material-ui.reagent :refer [date-picker]
             :rename {date-picker material-date-picker}]
            [oph.va.admin-ui.theme :as theme]))

(defn default-style [style]
  (if (nil? (:margin style))
      (merge theme/text-field style)
      style))

(defn text-field [p]
  (let [props
        (assoc p :label-text (or (:floating-label-text p) (:label-text p)))]
   [:div {:class "oph-field" :style (default-style (:style p))}
    [:span {:class "oph-label" :aria-describedby "field-text"}
     (:label-text props)]
    [:input
     (update (select-keys props [:value :type :on-change :type :size :min :max
                                 :max-length])
             :class str "oph-input")]
    (when-some [help-text (:help-text props)]
      [:div {:class "oph-field-text"} help-text])]))

(defn select-field [props values]
  [:div {:class "oph-field" :style (default-style (:style props))}
   [:label {:class "oph-label"} (or (:label props)
                                    (:floating-label-text props))]
   [:div {:class "oph-select-container"}
    [:select {:class "oph-input oph-select"
              :value (or (:value props) "")
              :on-change #((:on-change props) (.-value (.-target %))) }
     (for [value values]
       [:option {:value (:value value)
                 :key (:value value)}
        (:primary-text value)])]]])

(defn date-picker [props]
  (let [label (or (:floating-label-text props) (:label props))]
   [:div {:class "oph-field" :style (default-style (:style props))}
    [:span {:class "oph-label" :aria-describedby "field-text"} label]
    [material-date-picker {:value (:value props)
                           :class "oph-input"
                           :name label
                           :underline-show false
                           :style {:width "auto" :height "auto"}
                           :text-field-style {:width "auto"
                                              :height "auto"
                                              :line-height "inherit"
                                              :font-family "inherit"}
                           :input-style {}
                           :on-change (:on-change props)}]]))

(defn remove-nils [c] (disj c nil))

(defn generate-button-class [props]
  (->> (hash-set
         "oph-button"
         (:class props)
         (when (:disabled props) "oph-button-disabled")
         (when (:primary props) "oph-button-primary"))
       remove-nils
       (string/join " ")
       string/trim))

(defn button [p]
  [:button
   (-> p
       (select-keys [:on-click :style :disabled])
       (assoc :class (generate-button-class p))
       (update :style default-style))
   (:label p)])

(def raised-button button)

(defn tabs [children]
  (let [selected (r/atom 0)]
   (fn [children]
    [:div {:class "oph-typography"}
     [:div {:class "oph-tabs" :style theme/tabs-header}
      (doall
        (map-indexed
          (fn [i c]
            [:a {:key i
                 :style theme/tab-header-link
                 :on-click #(reset! selected i)
                 :class
                 (str "oph-tab-item"
                      (when (= @selected i) " oph-tab-item-is-active"))}
             (:label c)])
          children))]
     [:div
      (get-in children [@selected :content])]])))
