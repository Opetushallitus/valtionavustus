(ns oph.va.admin-ui.theme
  (:require [cljs-react-material-ui.core :refer [color]]))

(def material-styles
  {:font-family ["Open Sans" "Helvetica" "sans-serif"]
   :line-height "1.45"
   :table {:font-size "95%"}
   :palette {:text-color (color :black)
             :primary1-color "#00b5f0"
             :picker-header-color "#4c7f00"
             :accent1-color "#00b5f0"}})

(def general-styles
  {:font-family ["Open Sans" "Helvetica" "sans-serif"]
   :font-size "95%"
   :line-height "1.45"})

(def link {:color "#159ecb" :font-size "font-size: 1.25rem"})

(def active-link (assoc link :color "#2a2a2a"))

(def table-body {:overflow "auto"})

(def table-cell {:font-size 16})

(def table-header {:border-bottom "1px solid #f6f4f0"
                   :padding-bottom 10
                   :padding-right 14})

(def table-header-cell {:cursor "pointer"})

(def table table-cell)

(def table-empty-text {:background-color "#f0f0f0"
                       :padding 20})

(def table-footer {:overflow "hidden"
                   :border-top "1px solid #f6f4f0"
                   :padding-right 14})

(def hr-top {:color "#4c7f00"})

(def notice {:margin 10})

(def text-field {:margin 5 :display "inline-block"})

(def select-field text-field)

(def date-picker text-field)

(def tabs-header {:cursor "pointer"})

(def tab-header-link {:text-decoration "none"})

(def button (merge text-field {:margin 12}))

(def striped-row {:background-color "#f6f4f0"})

(def popup {:padding 10})

(def tooltip {:text-align "center"
              :margin-left 5
              :margin-right 5
              :width 20
              :height 20
              :border-radius 50
              :color "gray"
              :background-color "lightgray"
              :cursor "pointer"
              :padding "1px 5px 1px 5px"})
