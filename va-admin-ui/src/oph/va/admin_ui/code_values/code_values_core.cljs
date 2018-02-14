(ns oph.va.admin-ui.code-values-core
  (:require
   [reagent.core :as r]
   [cljsjs.material-ui]
   [cljs-react-material-ui.core :refer [color]]
   [cljs-react-material-ui.reagent :as ui]
   [cljs-react-material-ui.icons :as ic]
   [oph.va.admin-ui.theme :as theme]))

(defonce code-values (r/atom {}))

(defn render-add-code [props]
  [:div
   [ui/grid-list {:cols 4 :cell-height "auto"}
    [ui/text-field {:floating-label-text "Vuosi"}]
    [ui/text-field {:floating-label-text "Koodi"}]
    [ui/text-field {:floating-label-text "Osasto"}]
    [ui/text-field {:floating-label-text "Nimi"}]]
   [ui/raised-button {:label "Lisää" :primary true}]])

(defn render-code-row [i row]
  [ui/table-row i
   [ui/table-row-column (:year row)]
   [ui/table-row-column (:code row)]
   [ui/table-row-column (:secondary row)]
   [ui/table-row-column (:primary row)]])

(defn render-code-table [values]
  [ui/table {:fixed-header true :selectable false :body-style theme/table-body}
   [ui/table-header {:adjust-for-checkbox false :display-select-all false}
    [ui/table-header-column "Vuosi"]
    [ui/table-header-column "Koodi"]
    [ui/table-header-column "Osasto"]
    [ui/table-header-column "Nimi"]
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

(defn init! [])
