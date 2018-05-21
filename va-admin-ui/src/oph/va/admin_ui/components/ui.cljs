(ns oph.va.admin-ui.components.ui
  (:require [clojure.string :as string]
            [reagent.core :as r]
            [cljsjs.material-ui]
            [cljs-react-material-ui.reagent :refer [date-picker]
             :rename {date-picker material-date-picker}]
            [cljs-react-material-ui.icons :as ic]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.components.table :as va-table]
            [oph.va.admin-ui.utils :refer [format]]))

(defn format-date [d]
  (when (some? d)
   (format "%04d-%02d-%02d"
           (.getFullYear d)
           (+ (.getMonth d) 1 )
           (.getDate d))))

(defn get-rectangle [element]
  (if (some? element)
    (let [rect (.getBoundingClientRect element)]
      {:top (.-top rect)
       :left (.-left rect)})
    {:top 0 :left 0}))

(defn popover [props & content]
  (let [rect (get-rectangle (:anchor-el props))]
    [:div
     {:style
      {:display (when (not (:open props)) "none")
       :position "fixed"
       :top 0
       :bottom 0
       :left 0
       :right 0
       :z-index 2000}
      :on-click #(:on-request-close props)}
     [:div
      {:style
       {:box-shadow
        "rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px"
        :background-color "white"
        :color "black"
        :border-radius 2
        :position "fixed"
        :z-index 2100
        :overflow-y "auto"
        :top (:top rect)
        :left (:left rect)
        :opacity 1
        :box-sizing "border-box"
        :transform "scale(1, 1)"
        :transform-origin "left top 0px"
        :max-height 525}}
      (apply vector :div content)]]))

(defn tooltip [props text]
  (let [state (r/atom {:open false :anchor-el nil})]
    (fn [props text]
      [:span {:style (merge theme/tooltip (:style props))}
       [:span
        {:style (:button-style props)
         :on-click
         (fn [e]
           (swap! state assoc
                  :open (not (:open @state))
                  :anchor-el (.-target e)))}
        (get props :icon "?")
        [popover
         (merge @state
                {:on-request-close #(swap! state assoc :open false)})
         [:div {:style (merge theme/popup (:content-style props))} text]]]])))

(defn- add-validator [on-change validator]
  (if (some? validator)
    (fn [v]
      (when (validator v) (on-change v)))
    on-change))

(defn text-field [p]
  (let [props
        (assoc p :label-text (or (:floating-label-text p) (:label-text p)))]
   [:div {:class "oph-field" :style (merge theme/text-field (:style p))}
    [:span {:class "oph-label" :aria-describedby "field-text"}
     (:label-text props)
     (when-some [text (:tooltip props)] [tooltip {} text])]
    [:input
     (-> props
         (select-keys [:value :type :type :size :min :max
                             :max-length :on-key-press])
         (update :class str " oph-input" (when (= (:size p) :small) " small"))
         (assoc
           :style (if (:error props) {:border-color "#f44336"} {})
           :on-change (add-validator (:on-change props) (:validator props))
           :on-key-press #(when (and (some? (:on-enter-pressed props))
                                     (= (.-key %) "Enter"))
                            ((:on-enter-pressed props)))))]
    (when-some [help-text (:help-text props)]
      [:div {:class "oph-field-text"} help-text])]))

(defn select-field [props]
  [:div {:class "oph-field" :style (merge theme/select-field (:style props))}
   [:label {:class "oph-label"} (or (:label props)
                                    (:floating-label-text props))]
   [:div {:class "oph-select-container"}
    [:select {:class "oph-input oph-select"
              :value (or (:value props) (first (:values props)))
              :on-change #((:on-change props) (.-value (.-target %)))}
     (when (:include-empty? props)
       [:option {:value nil
                 :key nil}
        ""])
     (doall
       (map
         (fn [value] [:option {:value (:value value)
                               :key (:value value)}
                      (:primary-text value)])
         (:values props)))]]])

(defn date-picker-va [props]
  (let [label (or (:floating-label-text props) (:label props))]
   [:div {:class "oph-field" :style (merge theme/date-picker (:style props))}
    [:span {:class "oph-label"
            :aria-describedby "field-text"
            :style {:display "block"}}
     label
     (when-some [text (:tooltip props)] [tooltip {} text])]
    [:input
     {:value (format-date (:value props))
      :class "oph-input"
      :name label
      :type "date"
      :style {:width "auto" :height "auto"}
      :on-change (:on-change props)}]]))

(defn date-picker [props]
  (let [label (or (:floating-label-text props) (:label props))]
   [:div {:class "oph-field" :style (merge theme/date-picker (:style props))}
    [:span {:class "oph-label" :aria-describedby "field-text"}
     label
     (when-some [text (:tooltip props)] [tooltip {} text])]
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

(defn set-button-style [props]
  (assoc props :style (merge theme/button (:style props))))

(defn button [p]
  [:button
   (-> p
       (select-keys [:on-click :style :disabled])
       (assoc :class (generate-button-class p))
       set-button-style)
   (:label p)])

(def raised-button button)

(def table va-table/table)

(defn arrow [{:keys [style direction]}]
  [:span {:style style}
   (if (= direction :down)
     [ic/navigation-arrow-drop-down]
     [ic/navigation-arrow-drop-up])])

(defn tab [props & content]
  [:div
   (apply vector :div content)])

(defn tabs [props & children]
  [:div {:class "oph-typography"}
   [:div {:class "oph-tabs" :style {:cursor "pointer"}}
    (doall
      (map-indexed
        (fn [i t]
          (let [value (:value (second t))]
            [:a {:key i
                 :class
                 (str "oph-tab-item"
                      (when (= value (:value props))
                        " oph-tab-item-is-active"))
                 :on-click #((:on-change props) value)}
             (:label (second t))]))
        children))]
   [:div {:class "oph-tab-pane oph-tab-pane-is-active" } (some #(when (= (:value (second %)) (:value props)) %) children )]])

(defn card-text [& content]
  (apply vector :div {:style {:padding 20}} content))

(defn card [props & children]
  (let [style (if (some? (:style props))
                (merge theme/card-style (:style props))
                theme/card-style)]
    (apply vector :div (merge props {:style style}) children)))
