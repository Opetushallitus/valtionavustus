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
   [oph.va.admin-ui.va-code-values.va-code-values-core :as code-values-core]
   [oph.va.admin-ui.reports.reports-core :as reports-core]
   [oph.va.admin-ui.user :as user]))

(defonce payments-state {:grants (r/atom [])
                         :applications (r/atom [])
                         :payments (r/atom [])
                         :current-applications (r/atom [])
                         :selected-grant (r/atom nil)
                         :batch-values (r/atom {})})

(defonce code-values-state {:code-values (r/atom [])
                            :code-filter (r/atom {})})

(defonce reports-state {:data (r/atom {})})

(def top-links
  {:grant-evaluations {:link "/avustushaku" :title "Hakemusten arviointi"}
   :grant-admin {:link "/admin/" :title "Hakujen hallinta"}
   :payments {:link"/admin-ui/payments/" :title "Maksatusten hallinta"}
   :va-code-values {:link "/admin-ui/va-code-values/"
                    :title "VA-Koodienhallinta"}
   :va-pulse {:link "/admin-ui/reports/" :title "VA-pulssi"}})

(defn create-link [href title active]
  [:a {:key href :href href
       :style (if active theme/active-link theme/link)}
   title])

(defn render-top-links [current-path links]
  [:div {:class "top-links"}
   (doall
     (map
       (fn [[k {:keys [link title]}]]
         (create-link link title (= current-path link)))
       links))
   [:div {:class "logout-button"}
    [ui/flat-button
     {:label "Kirjaudu ulos"
      :on-click #(router/redirect-to! "/login/logout")}]]])


(defn home-page []
  (let [data {:user-info (deref user/user-info)
              :delete-payments? (connection/delete-payments?)}]
    [ui/mui-theme-provider
    {:mui-theme (get-mui-theme (get-mui-theme theme/material-styles))}
    [:div
     [:div
      (render-top-links (router/get-current-path)
                        (if (user/is-admin? (deref user/user-info))
                          top-links
                          (dissoc top-links :va-code-values)))
      [:hr theme/hr-top]]
     (case (router/get-current-path)
       "/admin-ui/payments/" (payments-core/home-page payments-state data)
       "/admin-ui/va-code-values/"
       (code-values-core/home-page code-values-state)
       "/admin-ui/reports/" (reports-core/home-page reports-state)
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
            (put! dialog-chan 2)
            (if (:success user-info-result)
               (reset! user/user-info (:body user-info-result))
               (dialogs/show-error-message!
                "Virhe käyttäjätietojen latauksessa"
                (select-keys user-info-result [:status :error-text])))))
        (dialogs/show-error-message!
          "Virhe asetusten latauksessa"
          (select-keys config-result [:status :error-text])))
      (put! dialog-chan 3)
      (close! dialog-chan)))
  (case (router/get-current-path)
   "/admin-ui/payments/" (payments-core/init! payments-state)
   "/admin-ui/va-code-values/" (code-values-core/init! code-values-state)
   "/admin-ui/reports/" (reports-core/init! reports-state)
   ""))
