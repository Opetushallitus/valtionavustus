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
   [va-payments-ui.theme :refer [button-style general-styles material-styles]]))

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

(defn redirect-to! [url]
  (-> js/window
      .-location
      .-href
      (set! url)))

(defn redirect-to-login! []
  (redirect-to! connection/login-url-with-service))

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
   [:a {:href (str "/avustushaku/" grant-id) :style (:a general-styles)}
    "Hakemusten arviointi"]
   [:a {:href "/admin/"} "Hakujen hallinta"]
   [:a {:href "/payments"} "Maksatusten hallinta"]
   [:div {:class "logout-button"}
    [ui/flat-button
     {:label "Kirjaudu ulos"
      :on-click #(redirect-to! "/login/logout")}]]])

(defn show-dialog! [content]
  (swap! dialog assoc :open true :content content))

(defn render-admin-tools []
  [:div
   [:hr]
   (when @delete-payments?
     [ui/grid-list {:cols 6 :cell-height "auto"}
      [ui/raised-button
       {:primary true :label "Poista maksatukset" :style (:raised-button material-styles)
        :on-click
        (fn []
          (go
            (let [grant-id (:id @selected-grant)
                  response
                  (<! (connection/delete-grant-payments grant-id))]
              (if (:success response)
                (let [download-response
                      (<! (connection/get-grant-payments grant-id))]
                  (if (:success download-response)
                    (reset! payments (:body download-response))
                    (show-message! "Virhe tietojen latauksessa")))
                (show-message! "Virhe maksatusten poistossa")))))}]])])

(defn home-page []
  [ui/mui-theme-provider
   {:mui-theme (get-mui-theme (get-mui-theme material-styles))}
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
              (go
                (let [grant-id (:id @selected-grant)
                      applications-response
                      (<! (connection/get-grant-applications grant-id))
                      payments-response
                      (<! (connection/get-grant-payments grant-id))]
                  (if (:success applications-response)
                    (reset! applications (:body applications-response))
                    (show-message! "Virhe hakemusten latauksessa"))
                  (if (:success payments-response)
                    (reset! payments (:body payments-response))
                    (show-message! "Virhe maksatusten latauksessa")))))))})
    (let [current-applications (-> @applications
                                   (api/combine @payments))
          payment-values
          (r/atom {:currency "EUR" :payment-term "Z001" :partner ""
                   :document-type "XA" :organisation "6600" :state 0
                   :transaction-account "5000" :due-date (js/Date.)
                   :invoice-date (js/Date.) :receipt-date (js/Date.)})]
      [(fn []
         [:div
          [:div
           [:hr]
           (project-info @selected-grant)
           [:hr]
           [:div
            [:h3 "Maksatuksen tiedot"]
            (financing/payment-emails
              @payment-values #(swap! payment-values assoc %1 %2))
             (financing/payment-fields
              @payment-values #(swap! payment-values assoc %1 %2))
             ]
           [:h3 "Myönteiset päätökset"]
            (applications/applications-table
              current-applications
              (fn [id]
                (go
                  (let [result (<! (connection/get-payment-history id))]
                    (if (:success result)
                      (show-dialog!
                        (r/as-element
                          (payments/render-history (:body result))))
                      (show-message! "Virhe historiatietojen latauksessa"))))))]
          [ui/raised-button
            {:primary true
             :disabled (or
                         (any-nil?
                           @payment-values
                           [:transaction-account :due-date :invoice-date
                            :payment-term :document-type :receipt-date])
                         (not (financing/valid-email?
                           (:inspector-email @payment-values)))
                         (not (financing/valid-email?
                           (:acceptor-email @payment-values))))
             :label "Lähetä maksatukset"
             :style button-style
             :on-click
             (fn [_]
               (go
                 (let [nin-result
                       (<! (connection/get-next-installment-number))]
                   (if (:success nin-result)
                     (let [values (conj @payment-values (:body nin-result))]
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
                           (show-message!
                             "Maksatuksien latauksessa ongelma"))))
                     (show-message! "Maksatuserän haussa ongelma")))))}]
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
  (go
    (let [config-result (<! (connection/get-config))]
      (if (:success config-result)
        (do (reset! delete-payments?
              (get-in config-result [:body :payments :delete-payments?]))
            (connection/set-config! (:body config-result))
            (let [user-info-result (<! (connection/get-user-info))]
              (if (:success user-info-result)
                (do
                  (reset! user-info (:body user-info-result))
                  (let [grants-result (<! connection/get-grants)]
                    (if (:success grants-result)
                      (do (reset! grants (:body grants-result))
                          (reset! selected-grant
                                  (if-let [grant-id (get-param-grant)]
                                    (first (filter #(= (:id %) grant-id)
                                                   (:body grants-result)))
                                    (first (:body grants-result))))
                          (when-let [selected-grant-id (:id @selected-grant)]
                            (let [grant-id (:id @selected-grant)
                                  applications-response
                                  (<! (connection/get-grant-applications
                                        grant-id))
                                  payments-response
                                  (<! (connection/get-grant-payments grant-id))]
                              (if (:success applications-response)
                                (reset! applications
                                        (:body applications-response))
                                (show-message! "Virhe hakemusten latauksessa"))
                              (if (:success payments-response)
                                (reset! payments (:body payments-response))
                                (show-message!
                                  "Virhe maksatusten latauksessa")))))
                    (show-message! "Virhe tietojen latauksessa")))
                (show-message! "Virhe käyttäjätietojen latauksessa")))))
        (show-message! "Virhe asetusten latauksessa")))))
