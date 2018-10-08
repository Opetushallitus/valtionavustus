(ns oph.va.admin-ui.dialogs
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require
   [cljs.core.async :refer [<! chan sliding-buffer put! close!]]
   [reagent.core :as r]
   [cljs-react-material-ui.core :refer [color]]
   [cljs-react-material-ui.icons :as ic]
   [cljsjs.material-ui]
   [cljs-react-material-ui.reagent :as ui]
   [oph.va.admin-ui.user :as user]
   [oph.va.admin-ui.components.ui :as va-ui]
   [oph.va.admin-ui.utils :refer [format]]))

(defonce ^:private dialogs (r/atom {:generic {:open false}
                                    :loading {}
                                    :snackbar {:open false :message ""}
                                    :error-dialog {:open false}}))

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

(defn show-error-dialog! [message]
  (swap! dialogs update-in [:error-dialog]
         assoc :open true :message message :title "Virhe"))

(defn show-admin-message! [message status error-text]
  (show-error-dialog! (format "%s - %s (%d)" message error-text status)))

(defn show-error-message! [message {:keys [status error-text]}]
  (if (user/is-admin? (deref user/user-info))
    (show-admin-message! message status error-text)
    (show-error-dialog! message)))

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

(defn render-dialogs [{:keys [snackbar generic loading error-dialog]} on-close]
  [:div
   [ui/snackbar
    {:open (:open snackbar)
     :message (:message snackbar)
     :auto-hide-duration 4000
     :on-request-close #(on-close :snackbar)}]
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
     :content-style {:width "95%" :max-width "none"}}]
   [ui/dialog
    {:modal true
     :open (:open error-dialog)
     :actions [(r/as-element
                 [va-ui/button
                  {:label "Ok" :primary true
                   :on-click #(on-close :error-dialog)}])]
     :title (:title error-dialog)}
    (:message error-dialog)]])

(defn render []
  (render-dialogs
    @dialogs
     #(do (when (= % :snackbar)
            (swap! dialogs assoc :snackbar {:open false :message ""}))
          (swap! dialogs assoc-in [% :open] false))))

(defn conn-with-err-dialog! [dialog-msg error-msg f & args]
  (let [c (chan)]
    (go
      (let [dialog-chan (show-loading-dialog! dialog-msg 3)]
        (put! dialog-chan 1)
        (let [result (<! (apply f args))]
          (put! dialog-chan 2)
          (if (:success result)
            (>! c (or (:body result) ""))
            (show-error-message!
              error-msg
              (select-keys result [:status :error-text]))))
        (put! dialog-chan 3)
        (close! dialog-chan)
        (close! c)))
    c))
