(ns oph.va.admin-ui.code-values-core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [cljs.core.async :refer [<!]]
   [reagent.core :as r]
   [cljsjs.material-ui]
   [cljs-react-material-ui.core :refer [color]]
   [cljs-react-material-ui.reagent :as ui]
   [cljs-react-material-ui.icons :as ic]
   [oph.va.admin-ui.theme :as theme]
   [oph.va.admin-ui.connection :as connection]))

(defonce code-values (r/atom {}))

(def default-values {:year 2018 :code "" :secondary "" :primary ""})

(defn render-add-code [props]
  (let [v (r/atom default-values)]
    (fn [props]
      [:div {:style {:max-width 1000}}
       [:div
        [ui/text-field {:floating-label-text "Vuosi"
                        :value (:year @v)
                        :on-change #(swap! v assoc :year (.-value (.-target %)))
                        :style {:width 50 :margin-right 15}}]
        [ui/text-field {:floating-label-text "Koodi"
                        :value (:code @v)
                        :on-change #(swap! v assoc :code (.-value (.-target %)))
                        :style {:width 100 :margin-right 15}}]
        [ui/text-field {:floating-label-text "Osasto"
                        :value (:secondary @v)
                        :on-change #(swap! v assoc :secondary
                                           (.-value (.-target %)))
                        :style {:margin-right 15}}]
        [ui/text-field {:floating-label-text "Nimi"
                        :value (:primary @v)
                        :on-change #(swap! v assoc :primary
                                           (.-value (.-target %)))
                        :style {:margin-right 15}}]]
       [ui/raised-button {:label "Lisää" :primary true
                          :on-click
                          (fn []
                            (swap! code-values
                                   update (:type props) conj @v)
                            (reset! v default-values))}]])))

(defn render-code-row [i row]
  [ui/table-row {:key i}
   [ui/table-row-column (:year row)]
   [ui/table-row-column (:code row)]
   [ui/table-row-column (:secondary row)]
   [ui/table-row-column (:primary row)]])

(defn render-code-table [values]
  [ui/table {:fixed-header true :selectable false :body-style theme/table-body}
   [ui/table-header {:adjust-for-checkbox false :display-select-all false}
    [ui/table-row
     [ui/table-header-column "Vuosi"]
     [ui/table-header-column "Koodi"]
     [ui/table-header-column "Osasto"]
     [ui/table-header-column "Nimi"]]]
   [ui/table-body {:display-row-checkbox false}
    (doall (map-indexed render-code-row values))]])

(defn home-page []
  [:div
   [ui/tabs
    [ui/tab {:label "Toimintayksikkö"}
     [render-add-code {:type :operational-unit}]
     [render-code-table (:operational-unit @code-values)]]
    [ui/tab {:label "Projekti"}
     [render-add-code {:type :project}]]
    [ui/tab {:label "Toiminto"}
     [render-add-code {:type :operation}]]]])

(defn init! []
  (go
    (let [result (<! (connection/get-code-values-by-type))]
      (if (:success result)
        (reset! code-values (:body result))))))
