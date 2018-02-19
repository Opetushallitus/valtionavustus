(ns oph.va.admin-ui.va-code-values-core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [cljs.core.async :refer [<! put! close!]]
   [reagent.core :as r]
   [cljsjs.material-ui]
   [cljs-react-material-ui.core :refer [color]]
   [cljs-react-material-ui.reagent :as ui]
   [cljs-react-material-ui.icons :as ic]
   [oph.va.admin-ui.theme :as theme]
   [oph.va.admin-ui.connection :as connection]
   [oph.va.admin-ui.dialogs :as dialogs]))

(defonce code-values (r/atom {}))

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
  (let [v (r/atom {})]
    (fn [on-change]
      [:div {:style {:max-width 1000}}
       [:div
        [ui/text-field
         {:floating-label-text "Vuosi"
          :value (or (:year @v) "")
          :on-change #(swap! v assoc :year (.-value (.-target %)))
          :style (assoc theme/text-field :width 50)}]
        [ui/text-field
         {:floating-label-text "Koodi"
          :value (or (:code @v) "")
          :on-change #(swap! v assoc :code (.-value (.-target %)))
          :style (assoc theme/text-field :width 100)}]
        [ui/text-field
         {:floating-label-text "Nimi"
          :value (or (:name @v) "")
          :on-change #(swap! v assoc :name (.-value (.-target %)))
          :style theme/text-field}]]
       [ui/raised-button
        {:label "Lisää"
         :primary true
         :disabled (or (not= (count @v) 3)
                       (some #(when (not (some? %)) true) @v))
         :on-click
         (fn [e]
           (on-change @v)
           (reset! v {}))}]])))

(defn render-tab [k]
  [:div
   [render-add-item
    #(swap! code-values update k conj %)]
   (render-code-table (get @code-values k))])

(defn home-page []
  [:div
   [ui/tabs
    [ui/tab {:label "Toimintayksikkö"}
     (render-tab :operational-unit)]
    [ui/tab {:label "Projekti"}
     (render-tab :project)]
    [ui/tab {:label "Toiminto"}
     (render-tab :operation)]]])

(defn init! []
  (go
    (let [dialog-chan (dialogs/show-loading-dialog! "Ladataan koodeja" 1)
          result (<! (connection/get-va-code-values-by-type))]
      (put! dialog-chan 1)
      (if (:success result)
        (reset! code-values (:body result)))
      (close! dialog-chan))))
