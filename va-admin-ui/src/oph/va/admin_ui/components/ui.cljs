(ns oph.va.admin-ui.components.ui
  (:require [clojure.string :as string]
            [reagent.core :as r]))

(defn default-style [style]
  (if (nil? (:margin style))
      (assoc style :margin "5px")
      style))

(defn text-field [p]
  (let [props
        (assoc p :label-text (or (:floating-label-text p) (:label-text p)))]
   [:div {:class "oph-field" :style (default-style (:style p))}
    [:span {:class "oph-label" :aria-describedby "field-text"}
     (:label-text props)]
    [:input
     (update (select-keys props [:value :type :on-change])
             :class str "oph-input")]
    (when-some [help-text (:help-text props)]
      [:div {:class "oph-field-text"} help-text])]))

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

(defn tabs [children]
  (let [selected (r/atom 0)]
   (fn [children]
    [:div {:class "oph-typography"}
     [:div {:class "oph-tabs"}
      (doall
        (map-indexed
          (fn [i c]
            [:a {:key i
                 :on-click #(reset! selected i)
                 :class
                 (str "oph-tab-item"
                      (when (= @selected i) " oph-tab-item-is-active"))}
             (:label c)])
          children))]
     [:div
      (get-in children [@selected :content])]])))
