(ns oph.va.admin-ui.dialogs
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require
   [cljs.core.async :refer [<! put! chan close! sliding-buffer]]
   [reagent.core :as r]
   [oph.va.admin-ui.theme :as theme]
   [cljs-react-material-ui.core :refer [color]]
   [cljs-react-material-ui.icons :as ic]
   [cljsjs.material-ui]
   [cljs-react-material-ui.reagent :as ui]
   [oph.va.admin-ui.user :as user]))

(defonce user-info (r/atom {}))

(defonce dialogs (r/atom {:generic {:open false}
                          :loading {}
                          :snackbar {:open false :message ""}}))

(defn show-dialog! [title content]
  (swap! dialogs update-in [:generic]
         assoc :open true :content content :title title))

(defn show-error-message-dialog! [status error-text]
  (show-dialog!
    "Palvelimen virheviesti"
    (r/as-element
      [:div
       [:div "Virheviesti: " error-text]
       [:div "Virhekoodi: " status]])))

(defn show-message! [message]
  (swap! dialogs update-in [:snackbar] assoc :open true :message message))

(defn show-admin-message! [message status error-text]
  (swap! dialogs update-in [:snackbar] assoc
         :open true
         :message message
         :action-title "Lisätietoja"
         :on-action-click
         #(show-error-message-dialog! status error-text)))

(defn show-error-message! [message {:keys [status error-text]}]
  (if (user/is-admin? @user-info)
    (show-admin-message! message status error-text)
    (show-message! message)))

(defn show-loading-dialog! [message max-value]
  (let [id (.getTime (js/Date.))]
   (swap! dialogs update-in [:loading] assoc
          id {:content message :max max-value :value 0})
   (let [c (chan (sliding-buffer 1024))]
     (go-loop []
       (let [v (<! c)]
         (if v
           (do
             (swap! dialogs assoc-in [:loading id :value] v)
             (recur))
           (swap! dialogs update-in [:loading] dissoc id))))
     c)))

(defn render-dialogs [{:keys [snackbar generic loading]} on-close]
  [:div
   [ui/snackbar
    {:open (:open snackbar)
     :message (:message snackbar)
     :auto-hide-duration 4000
     :on-action-touch-tap (:on-action-click snackbar)
     :on-request-close #(on-close :snackbar)
     :action (:action-title snackbar)}]
   [ui/dialog
    {:on-request-close #(on-close :generic)
     :children (:content generic)
     :title
     (r/as-element
       [:div [ui/app-bar {:title (:title generic)
                          :show-menu-icon-button false
                          :icon-element-right
                          (r/as-element [ui/icon-button
                                         {:on-click #(on-close :generic)}
                                         [ic/navigation-close
                                          {:color (color :white)}]])}]])
     :open (:open generic)
     :content-style {:width "95%" :max-width "none"}}]
   [ui/dialog
    {:children
     (r/as-element

      [ui/list
       (doall
          (map-indexed
            (fn [i [_ c]]
              [ui/list-item
               {:key i}
               [:span
                {:style {:text-align "center" :width "100%"}}
                (:content c)]
               [ui/linear-progress
                {:max (:max c)
                 :value (:value c)
                 :mode "determinate"}]])
            loading))])
     :modal true
     :open (> (count loading) 0)
     :content-style {:width "95%" :max-width "none"}}]])

(defn render []
  (render-dialogs
    @dialogs
     #(do (when (= % :snackbar)
            (swap! dialogs assoc :snackbar {:open false :message ""}))
          (swap! dialogs assoc-in [% :open] false))))
