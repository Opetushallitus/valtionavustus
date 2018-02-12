(ns oph.va.admin-ui.core
  (:require
   [reagent.core :as r]
   [oph.va.admin-ui.theme :as theme]
   [cljsjs.material-ui]
   [cljs-react-material-ui.core :refer [get-mui-theme color]]
   [cljs-react-material-ui.reagent :as ui]
   [oph.va.admin-ui.router :as router]
   [oph.va.admin-ui.payments.payments-core :as payments-core]))

(defn home-page []
  [ui/mui-theme-provider
   {:mui-theme (get-mui-theme (get-mui-theme theme/material-styles))}
   [:div
    (case (router/get-current-path)
          "/payments/" (payments-core/home-page)
          (do
            (router/redirect-to! "/payments/")
            "Redirecting..."))]])

(defn mount-root [] (r/render [home-page] (.getElementById js/document "app")))

(defn init! []
  (mount-root)
  (case (router/get-current-path)
   "/payments/" (payments-core/init!)
   ""))
