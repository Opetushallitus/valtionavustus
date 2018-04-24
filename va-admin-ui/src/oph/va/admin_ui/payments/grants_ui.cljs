(ns oph.va.admin-ui.payments.grants-ui
  (:require [reagent.core :as r]
            [cljsjs.material-ui]
            [cljs-react-material-ui.core :refer [get-mui-theme color]]
            [cljs-react-material-ui.reagent :as ui]
            [cljs-react-material-ui.icons :as ic]
            [oph.va.admin-ui.theme :refer [material-styles]]
            [cljs-time.format :as f]
            [cljs-time.core :as t]
            [oph.va.admin-ui.payments.utils :refer [to-simple-date-time]]
            [oph.va.admin-ui.theme :as theme]))

(def status-strs
  {"resolved" "Ratkaistu"
   "published" "Julkaistu"
   "draft" "Luonnos"
   "deleted" "Poistettu"})

(defn grant-row
  [grant selected]
  [ui/table-row {:key (:id grant) :selected selected :style {:cursor "default"}}
   [ui/table-row-column {:style theme/table-cell} (get grant :register-number)]
   [ui/table-row-column {:style theme/table-cell} (get-in grant [:content :name :fi])]
   [ui/table-row-column {:style theme/table-cell} (get status-strs (get grant :status))]
   [ui/table-row-column {:style theme/table-cell}
    (to-simple-date-time (get-in grant [:content :duration :start]))]
   [ui/table-row-column {:style theme/table-cell}
    (to-simple-date-time (get-in grant [:content :duration :end]))]])

(defn grants-table
  [{:keys [on-change grants value]}]
  [ui/table
   {:on-cell-click #(on-change %1)
    :selectable true
    :multi-selectable false
    :height "250px"
    :style (:table material-styles)
    :class "table"}
   [ui/table-header {:display-select-all false :adjust-for-checkbox false}
    [ui/table-row {:style {:font-size "80px"}}
     [ui/table-header-column {:style theme/table-cell} "Diaarinumero"]
     [ui/table-header-column {:style theme/table-cell} "Nimi"]
     [ui/table-header-column {:style theme/table-cell} "Tila"]
     [ui/table-header-column {:style theme/table-cell} "Haku alkaa"]
     [ui/table-header-column {:style theme/table-cell} "Haku päättyy"]]]
   [ui/table-body {:display-row-checkbox false :deselect-on-clickaway false}
    (for [grant grants] (grant-row grant (= (.indexOf grants grant) value)))]])

(defn project-info [grant]
  [:div
   [:h3 (get-in grant [:content :name :fi])]
   [ui/grid-list {:cols 6 :cell-height "auto" :style {:margin 20}}
    [:div [:label "Toimintayksikkö: "] (:operational-unit grant)]
    [:div [:label "Projekti: "] (:project grant)]
    [:div [:label "Toiminto: "] (:operation grant)]]])
