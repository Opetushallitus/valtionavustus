(ns va-payments-ui.core
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require
    [cljs.core.async :refer [<! put! chan close! sliding-buffer]]
    [va-payments-ui.connection :as connection]
    [reagent.core :as r]
    [cljsjs.material-ui]
    [cljs-react-material-ui.core :refer [get-mui-theme color]]
    [cljs-react-material-ui.reagent :as ui]
    [va-payments-ui.payments-ui :as payments-ui]
    [va-payments-ui.payments :as payments]
    [va-payments-ui.applications :as applications]
    [va-payments-ui.connection :as connection]
    [va-payments-ui.router :as router]
    [va-payments-ui.grants-ui :refer [grants-table project-info]]
    [va-payments-ui.grants :refer [grant-matches? remove-old convert-dates]]
    [va-payments-ui.financing :as financing]
    [va-payments-ui.utils :refer
     [toggle remove-nil format no-nils? not-empty? not-nil? find-index-of]]
    [va-payments-ui.theme :as theme]))

(defonce grants (r/atom []))

(defonce applications (r/atom []))

(defonce payments (r/atom []))

(defonce selected-grant (r/atom nil))

(defonce user-info (r/atom {}))

(defonce delete-payments? (r/atom false))

(defonce grant-filter (r/atom {:filter-str "" :filter-old true}))

(defonce dialogs (r/atom {:generic {:open false}
                          :loading {:open false}
                          :snackbar {:open false :message ""}}))

(defn show-message! [message]
  (swap! dialogs update-in [:snackbar] assoc :open true :message message))

(defn show-error-message! [code text]
  (show-message!
    (format "Virhe tietojen latauksessa. Virhe %s (%d)" text code)))

(defn show-loading-dialog! [message max-value]
  (swap! dialogs update-in [:loading] assoc
         :open true :content message :max max-value :value 0)
  (let [c (chan (sliding-buffer 1024))]
    (go-loop []
      (let [v (<! c)]
        (if v
          (do
            (swap! dialogs assoc-in [:loading :value] v)
            (recur))
          (swap! dialogs assoc-in [:loading :open] false))))
    c))

(defn show-dialog! [content]
  (swap! dialogs update-in [:generic] assoc :open true :content content))

(defn redirect-to-login! []
  (router/redirect-to! connection/login-url-with-service))

(defn get-param-grant []
  (let [grant-id (js/parseInt (router/get-current-param :grant))]
    (when-not (js/isNaN grant-id) grant-id)))

(defn create-link [href title active]
  [:a {:href href :style (if active theme/active-link theme/link)} title])

(defn top-links [grant-id current-path]
  [:div {:class "top-links"}
   (create-link (str "/avustushaku/" grant-id)
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

(defn render-admin-tools []
  [:div
   [:hr]
   [ui/grid-list {:cols 6 :cell-height "auto"}
    [ui/raised-button
     {:primary true
      :label "Poista maksatukset"
      :style theme/button
      :on-click (fn []
                  (go (let [grant-id (:id @selected-grant)
                            response (<! (connection/delete-grant-payments
                                           grant-id))]
                        (if (:success response)
                          (let [download-response
                                  (<! (connection/get-grant-payments grant-id))]
                            (if (:success download-response)
                              (reset! payments (:body download-response))
                              (show-message! "Virhe tietojen latauksessa")))
                          (show-message! "Virhe maksatusten poistossa")))))}]]])

(defn is-admin?
  [user]
  (not-nil? (some #(= % "va-admin") (get user :privileges))))

(defn render-dialogs [{:keys [snackbar generic loading]} on-close]
  [:div
   [ui/snackbar
    (conj snackbar
          {:auto-hide-duration 4000
           :on-request-close #(on-close :snackbar)})]
   [ui/dialog
    {:on-request-close #(on-close :generic)
     :children (:content generic)
     :open (:open generic)
     :content-style {:width "95%" :max-width "none"}}]
   [ui/dialog
    {:children
     (r/as-element
       [:div
        [ui/linear-progress
         {:max (:max loading)
          :value (:value loading)
          :mode "determinate"}]
        [:span
         {:style {:text-align "center" :width "100%"}}
         (:content loading)]])
     :modal true
     :open (:open loading)
     :content-style {:width "95%" :max-width "none"}}]])

(defn render-grant-filters [values on-change]
  [:div
   [ui/text-field
    {:floating-label-text "Hakujen suodatus"
     :value (:filter-str values)
     :on-change #(on-change :filter-str (.-value (.-target %)))}]
   [ui/toggle
    {:label "Piilota vanhat haut"
     :toggled (:filter-old values)
     :on-toggle #(on-change :filter-old %2)
     :style {:width "200px"}}]])

(defn send-payments! [applications-to-send payment-values]
  (go
    (let [dialog-chan
          (show-loading-dialog!
            "Lähetetään maksatuksia"
            (+ (count applications-to-send) 10))
          nin-result
          (<! (connection/get-next-installment-number))]
      (put! dialog-chan 1)
      (if (:success nin-result)
        (let [values (conj payment-values (:body nin-result))]
          (loop [index 0]
            (when-let [application
                       (get applications-to-send index)]
              (let [payment-result
                    (<! (connection/create-payment
                          (assoc values :application-id
                                 (:id application))))]
                (put! dialog-chan (inc index))
                (if (:success payment-result)
                  (recur (inc index))
                  (show-message!
                    "Maksatuksen lähetyksessä ongelma")))))
          (let [grant-result (<! (connection/get-grant-payments
                                   (:id @selected-grant)))]
            (if (:success grant-result)
              (reset! payments (:body grant-result))
              (show-message!
                "Maksatuksien latauksessa ongelma"))))
        (show-message! "Maksatuserän haussa ongelma"))
      (put! dialog-chan (+ (count applications-to-send) 10))
      (close! dialog-chan))))

(defn home-page []
  [ui/mui-theme-provider
   {:mui-theme (get-mui-theme (get-mui-theme theme/material-styles))}
   [:div
    (top-links (get @selected-grant :id 0) (router/get-current-path))
    [:hr]
    [:div
     (render-grant-filters @grant-filter #(swap! grant-filter assoc %1 %2))
     (let [filtered-grants
           (filterv #(grant-matches? % (:filter-str @grant-filter))
                    (if (:filter-old @grant-filter)
                      (remove-old @grants)
                      @grants))]
       (grants-table
         {:grants filtered-grants
          :value (find-index-of filtered-grants
                                #(= (:id %) (:id @selected-grant)))
          :on-change (fn [row]
                       (reset! selected-grant (get filtered-grants row)))}))]
    (let [current-applications (-> @applications
                                   (payments-ui/combine @payments))
          payment-values
            (r/atom {:currency "EUR"
                     :payment-term "Z001"
                     :partner ""
                     :document-type "XA"
                     :organisation "6600"
                     :state 0
                     :transaction-account "5000"
                     :due-date (financing/now-plus financing/week-in-ms)
                     :invoice-date (js/Date.)
                     :receipt-date (js/Date.)})]
      [(fn []
         [:div
          [:div
           [:hr]
           (project-info @selected-grant)
           [:hr]
           [:div
            (when (some #(= (get % :payment-state) 2) current-applications)
              {:style {:opacity 0.2 :pointer-events "none"}})
            [:h3 "Maksatuksen tiedot"]
            (financing/payment-emails @payment-values
                                      #(swap! payment-values assoc %1 %2))
            (financing/payment-fields @payment-values
                                      #(swap! payment-values assoc %1 %2))]
           [:h3 "Myönteiset päätökset"]
           (applications/applications-table
             {:applications current-applications
              :on-info-clicked
                (fn [id]
                  (go
                    (let [result (<! (connection/get-payment-history id))]
                      (if (:success result)
                        (show-dialog! (r/as-element (payments-ui/render-history
                                                      (:body result))))
                        (show-message!
                          "Virhe historiatietojen latauksessa")))))
              :is-admin? (is-admin? @user-info)})]
          [ui/raised-button
           {:primary true
            :disabled (not (payments/valid-payment-values? @payment-values))
            :label "Lähetä maksatukset"
            :style theme/button
            :on-click
            (fn [_]
              (send-payments!
                (filterv #(< (get % :payment-state) 2)
                         current-applications)
                @payment-values))}]])])
    (when (and @delete-payments? (is-admin? @user-info))
      (render-admin-tools))
    (render-dialogs @dialogs #(swap! dialogs assoc-in [% :open] false))]])

(defn mount-root [] (r/render [home-page] (.getElementById js/document "app")))

(defn init! []
  (mount-root)
  (add-watch
    selected-grant
    "s"
    (fn [_ _ ___ new-state]
      (when new-state
        (let [dialog-chan (show-loading-dialog! "Ladataan hakemuksia" 2)]
          (go
            (let [grant-id (:id new-state)
                  applications-response
                  (<! (connection/get-grant-applications grant-id))
                  payments-response (<! (connection/get-grant-payments grant-id))]
              (put! dialog-chan 1)
              (if (:success applications-response)
                (reset! applications (:body applications-response))
                (show-message! "Virhe hakemusten latauksessa"))
              (if (:success payments-response)
                (reset! payments (:body payments-response))
                (show-message! "Virhe maksatusten latauksessa"))
              (put! dialog-chan 2))
            (close! dialog-chan))))))
  (go
    (let [dialog-chan (show-loading-dialog! "Ladataan tietoja" 3)
          config-result (<! (connection/get-config))]
      (put! dialog-chan 1)
      (if (:success config-result)
        (do
          (reset! delete-payments?
                  (get-in config-result [:body :payments :delete-payments?]))
          (connection/set-config! (:body config-result))
          (let [user-info-result (<! (connection/get-user-info))]
            (put! dialog-chan 1)
            (if (:success user-info-result)
              (do
                (reset! user-info (:body user-info-result))
                (let [grants-result (<! (connection/get-grants))]
                  (put! dialog-chan 2)
                  (if (:success grants-result)
                    (do
                      (reset! grants (convert-dates (:body grants-result)))
                      (reset! selected-grant
                              (if-let [grant-id (get-param-grant)]
                                (first (filter #(= (:id %) grant-id) @grants))
                                (first @grants))))
                    (show-message! "Virhe tietojen latauksessa"))))
              (show-message! "Virhe käyttäjätietojen latauksessa"))))
        (show-message! "Virhe asetusten latauksessa")
        (put! dialog-chan 3))
     (close! dialog-chan))))
