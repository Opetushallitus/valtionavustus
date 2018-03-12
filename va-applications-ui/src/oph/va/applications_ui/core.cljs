(ns oph.va.applications-ui.core
  (:require [reagent.core :as r]
            [oph.va.applications-ui.management :as management]
            [oph.va.applications-ui.translations :refer [get-translation]]))

(defn header []
  [:div {:class "topbar"}
   [:div {:class "top-container"}
    [:img {:src "/img/logo.png" :width 240 :height 68 :class "logo"
           :alt "Opetushallitus / Utbildningsstyrelsen"}]
    [:div {:class "topbar-right"}]]])

(defn home-page []
  [:div
   (header)
   [:div {:class "content"}
    (management/home-page {:lng :fi})]])

(defn mount-root [] (r/render [home-page] (.getElementById js/document "app")))

(defn init! []
  (mount-root)
  (management/init! {:lng :fi}))
