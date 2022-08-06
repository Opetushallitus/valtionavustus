(ns oph.va.admin-ui.components.ui
  (:require [clojure.string :as string]
            [reagent.core :as r]
            [cljsjs.material-ui]
            [cljs-react-material-ui.reagent :refer [date-picker]
             :rename {date-picker material-date-picker}]
            [cljs-react-material-ui.icons :as ic]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.utils :refer [format delayed cancel!]]
            [oph.va.admin-ui.components.tools :refer [split-component]]))

(defn get-position [element]
  (if (some? element)
    (let [rect (.getBoundingClientRect element)]
      {:x (.-x rect)
       :y (.-y rect)})
    {:x 0 :y 0}))

(defn- popup [props content]
  (r/create-class
    {:display-name "VA popup"
     :component-did-mount
     (fn [e]
       (when (get props :focus-on-mount true)
         (.focus (r/dom-node e))))
     :reagent-render
     (fn [props content]
       [:div
        {:tab-index 1
         :style
         {:box-shadow
          "rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px"
          :background-color "white"
          :color "black"
          :border-radius 2
          :position "absolute"
          :z-index 350
          :overflow-y "auto"
          :x (:x props)
          :y (:y props)
          :opacity 1
          :box-sizing "border-box"
          :transform "scale(1, 1)"
          :transform-origin "left top 0px"
          :max-height 525}}
        (apply vector :div content)])}))

(defn popover [props & content]
  (let [rect (get-position (:anchor-el props))]
    (fn [props & content]
      [:div
       {:style {:display (when (not (:open props)) "none")}
        :tab-index 0
        :on-blur (fn [] ((:on-request-close props)))}
       (when (:open props)
         [popup
          (merge
            (select-keys props [:focus-on-mount])
            (select-keys rect [:x :y]))
          content])])))

(defn tooltip [props text]
  (let [state (r/atom {:open false :anchor-el nil})]
    (fn [props text]
      [:span {:style (:style props)
              :class "tooltip"}
       [:button
        {:style (merge theme/tooltip (:button-style props))
         :on-click
         (fn [e]
           (swap! state assoc
                  :open true
                  :anchor-el (.-target e))
           (.preventDefault e))}
        (get props :icon "?")]
       [popover
        (assoc @state
               :on-request-close
               (fn []
                 (swap! state assoc
                        :open false
                        :anchor-el nil)))
        [:div {:style (merge theme/popup (:content-style props))} text]]])))

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
          (select-keys [:value :type :type :size :min :max :placeholder
                        :max-length :on-key-press :on-blur])
          (update :class str " oph-input" (when (= (:size p) :small) " small"))
          (assoc
            :data-test-id (:data-test-id props)
            :style (if (:error props) {:border-color "#f44336"} {})
            :on-change (add-validator (:on-change props) (:validator props))
            :on-key-press #(when (and (some? (:on-enter-pressed props))
                                      (= (.-key %) "Enter"))
                             ((:on-enter-pressed props)))))]
     (when-some [help-text (:help-text props)]
       [:div {:class "oph-field-text"} help-text])]))

(defn select-field [props]
  [:div {:class "oph-field" :style (merge theme/select-field (:style props)) :data-test-id (:data-test-id props)}
   [:label {:class "oph-label"} (or (:label props)
                                    (:floating-label-text props))
    (when-some [text (:tooltip props)] [tooltip {} text])]
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
     (when (seq label)
       [:span {:class "oph-label"
               :aria-describedby "field-text"
               :style {:display "block"}}
        label
        (when-some [text (:tooltip props)] [tooltip {} text])])
     [:input
      {:value (:value props)
       :class (str "oph-input" (when (= (:size props) :small) " small"))
       :name label
       :type "date"
       :on-change #((:on-change props) (.-value (.-target %)))}]]))

(defn date-picker [props]
  (let [label (or (:floating-label-text props) (:label props))]
    [:div {:class "oph-field" :style (merge theme/date-picker (:style props))}
     [:span {:class "oph-label" :aria-describedby "field-text"}
      label
      (when-some [text (:tooltip props)] [tooltip {} text])]
     [material-date-picker {:value (:value props)
                            :class "oph-input"
                            :id (or (:id props) label)
                            :name label
                            :underline-show false
                            :style {:width "auto" :height "auto"}
                            :text-field-style theme/date-picker-field
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
       (select-keys [:on-click :style :disabled :title])
       (assoc
         :class (generate-button-class p)
         :data-test-id (:data-test-id p))
       set-button-style)
   (:label p)])

(def raised-button button)

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
   [:div {:style theme/sub-nav}
    (doall
      (map-indexed
        (fn [i t]
          (let [value (:value (second t))]
            [:a {:key i
                 :style (if (= value (:value props))
                          theme/sub-nav-item-selected
                          theme/sub-nav-item)
                 :on-click #((:on-change props) value)}
             (:label (second t))]))
        children))]
   [:div
    (some #(when (= (:value (second %)) (:value props)) %) children )]])

(defn card-text [& content]
  (apply vector :div {:style {:padding 20}} content))

(defn merge-style [props style]
  (if (some? (:style props))
    (merge style (:style props))
    style))

(defn card [props & children]
  (let [style (if (some? (:style props))
                (merge theme/card-style (:style props))
                theme/card-style)]
    (apply vector :div (merge props {:style style}) children)))

(defn badge [& body]
  (let [{:keys [props children]} (split-component body)]
    [:span {:style (merge-style props theme/badge)}
     (apply vector :span children)]))

(defn- render-item [index item on-click]
  [:div {:key index} [:a {:on-click #(on-click item)} item]])

(defn search-field [props]
  (let [search-delay (atom nil)
        popover-state (r/atom {:open false :anchor-el nil})]
    (fn [props]
      (let [{:keys [on-change on-search items]} props]
        [:span {:style {:display "inline-block"}}
         [text-field
          (assoc props
                 :on-blur
                 (fn []
                   (delayed
                     300
                     #(swap! popover-state assoc :open false)))
                 :on-change
                 (fn [e]
                   (swap! popover-state assoc :anchor-el (.-target e))
                   (let [value (.-value (.-target e))]
                     (on-change value)
                     (when (some? @search-delay)
                       (cancel! @search-delay))
                     (when (> (count value) (get props :min-length 1))
                       (reset!
                         search-delay
                         (delayed
                           (get props :delay 1000)
                           (fn []
                             (reset! search-delay nil)
                             (on-search value)
                             (swap! popover-state assoc :open true))))))))]
         [popover
          (assoc @popover-state
                 :focus-on-mount false
                 :on-request-close
                 (fn []
                   (swap! popover-state assoc :open false)))
          [:div {:style theme/search-popover}
           (cond
             (:searching props)
             [:img {:src "/virkailija/img/ajax-loader.gif"}]
             (seq items)
             (doall
               (map-indexed
                 (fn [i v]
                   (render-item
                     i v
                     (fn [item]
                       (swap! popover-state assoc :open false)
                       (on-change item))))
                 items))
             :else [:div "Ei hakutuloksia"])]]]))))
