(ns oph.va.admin-ui.core
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require
   [cljs.core.async :refer [<! put! chan close! sliding-buffer]]
   [reagent.core :as r]
   [oph.va.admin-ui.theme :as theme]
   [cljsjs.material-ui]
   [cljs-react-material-ui.core :refer [get-mui-theme color]]
   [cljs-react-material-ui.reagent :as ui]
   [oph.va.admin-ui.connection :as connection]
   [oph.va.admin-ui.router :as router]
   [oph.va.admin-ui.dialogs :as dialogs]
   [oph.va.admin-ui.payments.payments-core :as payments-core]
   [oph.va.admin-ui.code-values-core :as code-values-core]))

(defonce user-info (r/atom {}))

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
  (let [data {:user-info @user-info
              :delete-payments? (connection/delete-payments?)}]
    [ui/mui-theme-provider
    {:mui-theme (get-mui-theme (get-mui-theme theme/material-styles))}
    [:div
     [:div
      (top-links (router/get-current-path))
      [:hr theme/hr-top]]
     (case (router/get-current-path)
       "/admin-ui/payments/" (payments-core/home-page data)
       "/admin-ui/code-values/" (code-values-core/home-page)
       (do
         (router/redirect-to! "/admin-ui/payments/")
         "Redirecting..."))
     (dialogs/render)]]))

(defn mount-root [] (r/render [home-page] (.getElementById js/document "app")))

(defn init! []
  (mount-root)
   (go
    (let [dialog-chan (dialogs/show-loading-dialog! "Ladataan asetuksia" 3)
          config-result (<! (connection/get-config))]
      (put! dialog-chan 1)
      (if (:success config-result)
        (do
          (connection/set-config! (:body config-result))
          (let [user-info-result (<! (connection/get-user-info))]
            (put! dialog-chan 1)
            (if (:success user-info-result)
               (reset! user-info (:body user-info-result))
               (dialogs/show-error-message!
                "Virhe käyttäjätietojen latauksessa"
                (select-keys user-info-result [:status :error-text])))))
        (dialogs/show-error-message!
          "Virhe asetusten latauksessa"
          (select-keys config-result [:status :error-text])))
      (put! dialog-chan 3)
      (close! dialog-chan)))
  (case (router/get-current-path)
   "/admin-ui/payments/" (payments-core/init!)
   "/admin-ui/code-values/" (code-values-core/init!)
   ""))
