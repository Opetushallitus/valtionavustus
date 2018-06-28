(ns oph.va.admin-ui.theme
  (:require [cljs-react-material-ui.core :refer [color]]))

(def material-styles
  {:font-family ["Open Sans" "Helvetica" "sans-serif"]
   :line-height "1.45"
   :palette {:text-color (color :black)
             :primary1-color "#00b5f0"
             :picker-header-color "#4c7f00"
             :accent1-color "#00b5f0"}})

(def general-styles
  {:font-family ["Open Sans" "Helvetica" "sans-serif"]
   :line-height "1.45"})

(def link {:color "#159ecb" :font-size "font-size: 1.25rem"})

(def active-link (assoc link :color "#2a2a2a"))

(def top-link {:color "#999290" :font-size "font-size: 1.25rem"})

(def top-active-link (assoc link :color "black"))


(def grant-info-item {:display "inline-block"
                      :padding 10
                      :width 200})

(def info-label {:font-weight "bold"
                 :color "grey"})

(def sub-nav {:border-bottom "2px solid #e3e3e3"
              :text-transform "uppercase"
              :font-size 16
              :padding-top 10
              :padding-bottom 5
              :padding-left 10
              :border-top "2px solid #f0f0f0"})

(def sub-nav-item {:color "#999290"
                   :margin-right 50
                   :cursor "pointer"
                   :padding-bottom 6})

(def sub-nav-item-selected
  (assoc sub-nav-item
         :color "#159ecb"
         :border-bottom "2px solid #159ecb"))

(def grants-table {:background-color "#f5f5f5"
                   :padding-bottom 10})

(def grants-table-header {:border-bottom "1px solid rgb(208, 207, 204)"})

(def app-container {:padding "55px 5px 5px 5px"
                    :background-color "#fafafa"})

(def top-links {:box-shadow "0 1px 2px 0 rgba(0, 0, 0, 0.1)"
                :font-size 18
                :text-transform "uppercase"
                :height 30
                :padding-top 5
                :padding-bottom 20
                :position "fixed"
                :width "100%"
                :background-color "white"})

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

(def table-row {:cursor "pointer"})

(def table-row-missing-value {:color "rgb(218, 35, 35)"})

(def selected-table-row
  (assoc table-row
         :background-color "#159ecb"
         :color "white"))

(def notice {:margin 10})

(def text-field {:margin 5 :display "inline-block"})

(def select-field text-field)

(def date-picker text-field)

(def date-picker-field
  {:width "auto"
   :height "auto"
   :line-height "inherit"
   :font-family "inherit"
   :font-size 13})

(def tabs-header {:cursor "pointer"})

(def tab-header-link {:text-decoration "none"})

(def button (merge text-field {:margin 12}))

(def striped-row {:background-color "#f6f4f0"})

(def popup {:padding 10})

(def tooltip
  {:border-radius 50
   :color "gray"
   :background-color "lightgray"
   :cursor "pointer"
   :margin-left 5
   :border-color "transparent"
   :box-shadow
   "0 2px 2px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)"})

(def card-style
  {:box-shadow
   "rgba(0, 0, 0, 0.12) 0px 1px 6px, rgba(0, 0, 0, 0.12) 0px 1px 4px"
   :background-color "white"
   :border-radius "2px"
   :margin 10})

(def badge {:text-align "center"
            :margin-left 5
            :margin-right 5
            :border-radius 2
            :color "white"
            :background-color "#159ecb"
            :cursor "pointer"
            :padding "1px 5px 1px 5px"})
