(ns oph.va.applications-ui.core
  (:require [reagent.core :as r]
            [oph.va.applications-ui.management :as management]
            [oph.va.applications-ui.translations :refer [get-translation]]))

(defn home-page []
  (management/home-page {:lng :fi}))

(defn mount-root [] (r/render [home-page] (.getElementById js/document "app")))

(defn init! []
  (mount-root)
  (management/init! {:lng :fi}))
