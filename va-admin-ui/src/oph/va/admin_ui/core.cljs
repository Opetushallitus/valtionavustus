(ns oph.va.admin-ui.core
  (:require
   [reagent.core :as r]
   [oph.va.admin-ui.theme :as theme]
   [cljsjs.material-ui]
   [cljs-react-material-ui.core :refer [get-mui-theme color]]
   [cljs-react-material-ui.reagent :as ui]
   [oph.va.admin-ui.router :as router]
   [oph.va.admin-ui.payments.payments-core :as payments-core]))

(defn create-link [href title active]
  [:a {:href href :style (if active theme/active-link theme/link)} title])

(defn top-links [current-path]
  [:div {:class "top-links"}
   (create-link "/avustushaku"
                "Hakemusten arviointi"
                (= current-path "/avustushaku/"))
   (create-link "/admin/" "Hakujen hallinta" (= current-path "/admin/"))
   (create-link "/payments/"
                "Maksatusten hallinta"
                (= current-path "/payments/"))
   [:div {:class "logout-button"}
    [ui/flat-button
     {:label "Kirjaudu ulos"
      :on-click #(router/redirect-to! "/login/logout")}]]])


(defn home-page []
  [ui/mui-theme-provider
   {:mui-theme (get-mui-theme (get-mui-theme theme/material-styles))}
   [:div
    [:div
     (top-links (router/get-current-path))
     [:hr theme/hr-top]]
    (case (router/get-current-path)
          "/admin-ui/payments/" (payments-core/home-page)
          (do
            (router/redirect-to! "/admin-ui/payments/")
            "Redirecting..."))]])

(defn mount-root [] (r/render [home-page] (.getElementById js/document "app")))

(defn init! []
  (mount-root)
  (case (router/get-current-path)
   "/admin-ui/payments/" (payments-core/init!)
   ""))
