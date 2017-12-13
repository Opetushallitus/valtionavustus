(ns va-payments-ui.theme
  (:require
      [cljs-react-material-ui.core :refer [color]]))

(def button-style {:margin 12})

(def material-styles  {:font-family ["Open Sans", "Helvetica", "sans-serif"]
                       :table {:font-size "95%"}
                       :palette {:text-color (color :black)
                                 :primary1-color "#4c7f00"}})

(def general-styles {:font-family ["Open Sans", "Helvetica", "sans-serif"]
                     :font-size "95%"})
