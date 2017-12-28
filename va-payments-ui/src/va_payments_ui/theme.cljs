(ns va-payments-ui.theme
  (:require [cljs-react-material-ui.core :refer [color]]))

(def material-styles
  {:font-family ["Open Sans" "Helvetica" "sans-serif"]
   :line-height "1.45"
   :table {:font-size "95%"}
   :palette {:text-color (color :black)
             :primary1-color "#4c7f00"
             :picker-header-color "#4c7f00"
             :accent1-color "#00b5f0"}})

(def button {:margin 12})

(def general-styles
  {:font-family ["Open Sans" "Helvetica" "sans-serif"]
   :font-size "95%"
   :line-height "1.45"})

(def link {:color "#159ecb" :font-size "font-size: 1.25rem"})

(def active-link (assoc link :color "#2a2a2a"))

(def text-field-error {:border-color "#f44336"})
