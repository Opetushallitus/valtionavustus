(ns oph.va.admin-ui.va-code-values-core
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

(def default-values {:year 2018 :code "" :name ""})

(defn render-code-table [values]
  [ui/table {:fixed-header true :selectable false :body-style theme/table-body}
   [ui/table-header {:adjust-for-checkbox false :display-select-all false}
    [ui/table-row
     [ui/table-header-column "Vuosi"]
     [ui/table-header-column "Koodi"]
     [ui/table-header-column "Nimi"]]]
   [ui/table-body {:display-row-checkbox false}
    (doall
      (map-indexed
        (fn [i row]
          [ui/table-row {:key i}
           [ui/table-row-column (:year row)]
           [ui/table-row-column (:code row)]
           [ui/table-row-column (:name row)]])
        values))]])

(defn render-add-item [on-change]
  (let [v (r/atom default-values)]
    (fn [on-change]
      [:div {:style {:max-width 1000}}
       [:div
        [ui/text-field
         {:floating-label-text "Vuosi"
          :value (:year @v)
          :on-change #(swap! v assoc :year (.-value (.-target %)))
          :style (assoc theme/text-field :width 50)}]
        [ui/text-field
         {:floating-label-text "Koodi"
          :value (:code @v)
          :on-change #(swap! v assoc :code (.-value (.-target %)))
          :style (assoc theme/text-field :width 100)}]
        [ui/text-field
         {:floating-label-text "Nimi"
          :value (:name @v)
          :on-change #(swap! v assoc :name (.-value (.-target %)))
          :style theme/text-field}]]
       [ui/raised-button
        {:label "Lisää"
         :primary true
         :on-click
         (fn [e]
           (on-change @v)
           (reset! v default-values))}]])))

(defn home-page []
  [:div
   [ui/tabs
    [ui/tab {:label "Toimintayksikkö"}
     [render-add-item
      #(swap! code-values update :operational-unit conj %)]
     (render-code-table (:operational-unit @code-values))]
    [ui/tab {:label "Projekti"}
     [render-add-item
        #(swap! code-values update :project conj %)]
     (render-code-table (:project @code-values))]
    [ui/tab {:label "Toiminto"}
     [render-add-item
        #(swap! code-values update :operation conj %)]
     (render-code-table (:operation @code-values))]]])

(defn init! []
  (go
    (let [result (<! (connection/get-va-code-values-by-type))]
      (if (:success result)
        (reset! code-values (:body result))))))
