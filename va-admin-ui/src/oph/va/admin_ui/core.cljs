(ns oph.va.admin-ui.core
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require
   [cljs.core.async :refer [<! put! close!]]
   [reagent.core :as r]
   [oph.va.admin-ui.theme :as theme]
   [cljsjs.material-ui]
   [cljs-react-material-ui.core :refer [get-mui-theme]]
   [cljs-react-material-ui.reagent :as ui]
   [oph.va.admin-ui.connection :as connection]
   [oph.va.admin-ui.router :as router]
   [oph.va.admin-ui.dialogs :as dialogs]
   [oph.va.admin-ui.payments.payments-core :as payments-core]
   [oph.va.admin-ui.user :as user]))

(defonce environment (r/atom {}))

(defonce initialized (r/atom false))

(def top-links
  {:grant-admin {:link "/admin/haku-editor/" :title "Hakujen hallinta"}
   :grant-evaluations {:link "/" :title "Hakemusten arviointi"}
   :va-code-values {:link "/admin-ui/va-code-values/"
                    :title "VA-Koodienhallinta"}
   :search {:link "/haku/" :title "Haku"}})

(defn create-link [href title active]
  [:a {:key href :href href
       :style (if active theme/top-active-link theme/top-link)}
   title])

(defn render-top-links [current-path links selected-grant-id]
  [:div {:class "top-links"
         :style theme/top-links}
   (doall
     (map
       (fn [[k {:keys [link title]}]]
         (create-link link title (= current-path link)))
       (if (some? selected-grant-id)
         (update-in links [:grant-evaluations :link]
                    str "avustushaku/" selected-grant-id "/")
         links)))
   [:div {:class "logout-button"}
    [ui/flat-button
     {:label "Kirjaudu ulos"
      :on-click #(router/redirect-to! "/login/logout")}]]])


(defn home-page []
  (let [data {:user-info (deref user/user-info)
              :delete-payments? (connection/delete-payments?)}]
    [ui/mui-theme-provider
     {:mui-theme (get-mui-theme (get-mui-theme theme/material-styles))}
     [:div {:class "oph-typography"}
      (when @initialized
        [:div
         [:div {:style theme/top-links-container}
          [:img {:style theme/logo
                 :src "/img/logo-176x50@2x.png"
                 :width 176
                 :height 50
                 :alt "Opetushallitus / Utbildningsstyrelsen"}]
          (render-top-links
            (router/get-current-path)
            (cond-> top-links
              (not (user/is-admin? (deref user/user-info)))
              (dissoc top-links :va-code-values))
            (when (:selected-grant payments-core/state)
              (:id (deref (:selected-grant payments-core/state)))))]
         [:div {:style theme/app-container}
          (case (router/get-current-path)
            "/admin-ui/payments/" (payments-core/home-page data)
            (do
              (router/redirect-to! "/admin-ui/payments/")
              "Redirecting..."))]])
      (dialogs/render)]]))

(defn mount-root []
  (r/render [home-page] (.getElementById js/document "app")))

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
            (put! dialog-chan 2)
            (if (:success user-info-result)
              (do
                (reset! user/user-info (:body user-info-result))
                (reset! initialized true))
              (dialogs/show-error-message!
                "Virhe käyttäjätietojen latauksessa"
                (select-keys user-info-result [:status :error-text])))))
        (dialogs/show-error-message!
          "Virhe asetusten latauksessa"
          (select-keys config-result [:status :error-text])))
      (put! dialog-chan 3)
      (close! dialog-chan)
      (case (router/get-current-path)
        "/admin-ui/payments/" (payments-core/init!)
        ""))))
