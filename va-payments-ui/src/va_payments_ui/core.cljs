(ns va-payments-ui.core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [cljs.core.async :refer [<!]]
   [va-payments-ui.connection :as connection]
   [reagent.core :as r]
   [cljsjs.material-ui]
   [cljs-react-material-ui.core :refer [get-mui-theme color]]
   [cljs-react-material-ui.reagent :as ui]
   [va-payments-ui.api :as api]
   [va-payments-ui.payments :as payments]
   [va-payments-ui.applications :as applications]
   [va-payments-ui.connection :as connection]
   [va-payments-ui.router :as router]
   [va-payments-ui.grants :refer [grants-table project-info]]
   [va-payments-ui.financing :as financing]
   [va-payments-ui.utils
    :refer [toggle remove-nil format any-nil? not-empty?]]
   [va-payments-ui.theme :refer [button-style]]))

(defonce grants (r/atom []))

(defonce applications (r/atom []))

(defonce payments (r/atom []))

(defonce selected-grant (r/atom nil))

(defonce user-info (r/atom {}))

(defonce snackbar (r/atom {:open false :message ""}))

(defonce dialog (r/atom {:open false}))

(defonce delete-payments? (r/atom false))

(defn show-message! [message]
  (reset! snackbar {:open true :message message}))

(defn show-error-message! [code text]
  (show-message!
   (format "Virhe tietojen latauksessa. Virhe %s (%d)" text code)))

(defn redirect-to-login! []
  (-> js/window
      .-location
      .-href
      (set! connection/login-url-with-service)))

(defn find-index-of
  ([col pred i m]
   (if (>= i m)
     nil
     (if (pred (nth col i)) i (recur col pred (inc i) m))))
  ([col pred]
   (find-index-of col pred 0 (count col))))

(defn get-param-grant []
  (let [grant-id (js/parseInt (router/get-current-param :grant))]
    (when-not (js/isNaN grant-id) grant-id)))

(defn top-links [grant-id]
  [:div {:class "top-links"}
   [:a {:href (str "/avustushaku/" grant-id)}
    "Hakemusten arviointi"]
   [:a {:href "/admin/"} "Hakujen hallinta"]
   [:a {:href "/payments"} "Maksatusten hallinta"]
   [:div
    [ui/flat-button
     {:label "Kirjaudu ulos"
      :on-click #(redirect-to "/login/logout")}]]])

(defn render-payment-fields [on-change]
  (let [payment-values
        (r/atom {:currency "EUR" :payment-term "Z001" :partner ""
                 :document-type "XA" :organisation "6600" :state 0
                 :transaction-account "5000" :due-date (js/Date.)
                 :invoice-date (js/Date.) :receipt-date (js/Date.)})]
    [(fn []
       [:div
        (financing/payment-emails
         @payment-values #(swap! payment-values assoc %1 %2))
        (financing/payment-fields
         @payment-values #(swap! payment-values assoc %1 %2))
        [ui/raised-button
         {:primary true
          :disabled (any-nil?
                      @payment-values
                      [:inspector-email :acceptor-email :transaction-account
                       :due-date :invoice-date :payment-term :document-type
                       :receipt-date])
          :label "Lähetä maksatukset"
          :style button-style
          :on-click #(on-change @payment-values)}]])]))

(defn show-dialog! [content]
  (swap! dialog assoc :open true :content content))

(defn render-admin-tools []
  [:div
   [:hr]
   (when @delete-payments?
     [ui/grid-list {:cols 6 :cell-height "auto"}
      [ui/raised-button
       {:primary true :label "Poista maksatukset" :style button-style
        :on-click
        (fn []
          (api/delete-grant-payments!
           {:grant-id (:id @selected-grant)
            :on-success
            (fn [_]
              (api/download-grant-data
               (:id @selected-grant)
               (fn [a p]
                 (do (reset! applications a) (reset! payments p)))
               (fn [_ __])))
            :on-error (fn [_ __])}))}]])])

(defn home-page []
  [ui/mui-theme-provider
   {:mui-theme (get-mui-theme {:palette {:text-color (color :black)}})}
   [:div
    (top-links (get @selected-grant :id 0))
    [:hr]
    (grants-table
     {:grants @grants
      :value (find-index-of @grants #(= (:id %) (:id @selected-grant)))
      :on-change
      (fn [row]
        (do (reset! selected-grant (get @grants row))
            (when @selected-grant
              (do (api/download-grant-data
                   (:id @selected-grant)
                   #(do (reset! applications %1) (reset! payments %2))
                   #(show-message! "Virhe tietojen latauksessa"))))))})
    (let [current-applications (-> @applications
                                   (api/combine @payments))]
      [(fn []
         [:div
          [:div
           [:hr]
           (project-info @selected-grant)
           [:hr]
           [:h3 "Myönteiset päätökset"]
           (applications/applications-table
            current-applications
            (fn [id] (api/get-payment-history
                      {:application-id id
                       :on-success
                       #(show-dialog!
                         (r/as-element (payments/render-history %)))
                       :on-error
                       #(show-message!
                         "Virhe maksatuksen tietojen latauksessa")})))
           (render-payment-fields
             (fn [payment-values]
               (go
                 (let [nin-result (<! (connection/get-next-installment-number))]
                   (if (:success nin-result)
                     (let [values (conj payment-values (:body nin-result))]
                       (doseq [application current-applications]
                         (let [payment-result
                               (<! (connection/create-payment
                                     (assoc values :application-id
                                            (:id application))))]
                           (when-not (:success payment-result)
                             (show-message!
                               "Maksatuksen lähetyksessä ongelma"))))
                       (let [grant-result (<! (connection/get-grant-payments
                                                (:id @selected-grant)))]
                         (if (:success grant-result)
                           (reset! payments (:body grant-result))
                           (show-message! "Maksatuksien latauksessa ongelma"))))
                     (show-message! "Maksatuserän haussa ongelma"))))))]
          [ui/snackbar
           (conj @snackbar
                 {:auto-hide-duration 4000
                  :on-request-close
                  #(reset! snackbar {:open false :message ""})})]])])
    (render-admin-tools)
    [ui/dialog
     {:on-request-close #(swap! dialog assoc :open false)
      :children (:content @dialog)
      :open (:open @dialog)
      :content-style {:width "95%", :max-width "none"}}]]])

(defn mount-root []
  (r/render [home-page] (.getElementById js/document "app")))

(defn init! []
  (mount-root)
  (api/get-config
   {:on-error
    (fn [_ __] (show-message! "Virhe tietojen latauksessa"))
    :on-success
    (fn [config]
      (reset! delete-payments? (get-in config [:payments :delete-payments?]))
      (connection/set-config! config)
      (api/get-user-info
       {:on-success #(reset! user-info %)
        :on-error #(show-message! "Virhe käyttäjätietojen latauksessa")})
      (api/download-grants
       (fn [result]
         (do (reset! grants result)
             (reset! selected-grant
                     (if-let [grant-id (get-param-grant)]
                       (first (filter #(= (:id %) grant-id) result))
                       (first result))))
         (when-let [selected-grant-id (:id @selected-grant)]
           (do (api/download-grant-data
                selected-grant-id
                #(do (reset! applications %1) (reset! payments %2))
                #(show-message! "Virhe tietojen latauksessa")))))
       (fn [_ __] (show-message! "Virhe tietojen latauksessa"))))}))
