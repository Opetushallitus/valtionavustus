(ns oph.va.applications-ui.management
  (:require [reagent.core :as r]
            [oph.va.applications-ui.translations :refer [get-translation]]))

(defn home-page [{:keys [lng]}]
  [:div (get-translation :project lng)])

(defn init! [state])
