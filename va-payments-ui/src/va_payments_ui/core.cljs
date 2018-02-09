(ns va-payments-ui.core
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require
    [cljs.core.async :refer [<! put! chan close! sliding-buffer]]
    [va-payments-ui.connection :as connection]
    [reagent.core :as r]
    [cljsjs.material-ui]
    [cljs-react-material-ui.core :refer [get-mui-theme color]]
    [cljs-react-material-ui.reagent :as ui]
    [cljs-react-material-ui.icons :as ic]
    [va-payments-ui.payments-ui :as payments-ui]
    [va-payments-ui.payments :as payments]
    [va-payments-ui.applications :as applications]
    [va-payments-ui.connection :as connection]
    [va-payments-ui.router :as router]
    [va-payments-ui.grants-ui :refer [grants-table project-info]]
    [va-payments-ui.grants :refer [grant-matches? remove-old convert-dates]]
    [va-payments-ui.financing :as financing]
    [va-payments-ui.utils :refer
     [remove-nil format no-nils? not-empty? not-nil? find-index-of]]
    [va-payments-ui.theme :as theme]
    [cljs-time.format :as tf]
    [cljs-time.coerce :as tc]))

(defonce grants (r/atom []))

(defonce applications (atom []))

(defonce payments (atom []))

(defonce current-applications (r/atom []))

(defonce selected-grant (r/atom nil))

(defonce user-info (r/atom {}))

(defonce delete-payments? (r/atom false))

(defonce grant-filter (r/atom {:filter-str "" :filter-old true}))

(defonce dialogs (r/atom {:generic {:open false}
                          :loading {:open false}
                          :snackbar {:open false :message ""}}))

(def default-batch-values
  {:currency "EUR"
           :partner ""
           :document-type "XA"
           :transaction-account "5000"
           :due-date (financing/now-plus financing/week-in-ms)
           :invoice-date (js/Date.)
           :receipt-date (js/Date.)})

(defonce batch-values
  (r/atom {}))

(defn is-admin?
  [user]
  (not-nil? (some #(= % "va-admin") (get user :privileges))))

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
  (if (is-admin? @user-info)
    (show-admin-message! message status error-text)
    (show-message! message)))

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

(defn redirect-to-login! []
  (router/redirect-to! connection/login-url-with-service))

(defn get-param-grant []
  (let [grant-id (js/parseInt (router/get-current-param :grant))]
    (when-not (js/isNaN grant-id) grant-id)))

(defn create-link [href title active]
  [:a {:href href :style (if active theme/active-link theme/link)} title])

(defn top-links [grant-id current-path]
  [:div {:class "top-links"}
   (create-link (format "/avustushaku/%d/" grant-id)
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
                              (show-error-message!
                                "Virhe tietojen latauksessa"
                                (select-keys download-response
                                             [:status :error-text]))))
                          (show-error-message!
                            "Virhe maksatusten poistossa"
                            (select-keys response
                                         [:status :error-text]))))))}]]])

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
   [ui/icon-button {:on-click #(on-change :filter-str "")}
    [ic/action-highlight-off {:color "gray"}]]
   [ui/toggle
    {:label "Piilota vanhat haut"
     :toggled (:filter-old values)
     :on-toggle #(on-change :filter-old %2)
     :style {:width "200px"}}]])

(defn send-payments! [applications-to-send values]
  (go
    (let [dialog-chan
          (show-loading-dialog!
            "Lähetetään maksatuksia"
            (+ (count applications-to-send) 10))]
      (put! dialog-chan 1)
      (let [error
            (loop [index 0]
              (if-let [application
                       (get applications-to-send index)]
                (let [payment-result
                      (<! (connection/create-payment
                            {:batch-id (:batch-id values)
                             :application-id (:id application)
                             :state (:state values)}))]
                  (put! dialog-chan (inc index))
                  (if (:success payment-result)
                    (recur (inc index))
                    (select-keys payment-result [:status :error-text])))))]
        (if (nil? error)
          (let [email-result
                (<!
                  (connection/send-payments-email
                    (:id @selected-grant)
                    (select-keys values [:acceptor-email
                                         :inspector-email
                                         :organisation
                                         :batch-number
                                         :batch-id])))]
            (if (:success email-result)
              (show-message! "Kaikki maksatukset lähetetty")
              (show-message!
                "Kaikki maksatukset lähetetty, mutta vahvistussähköpostin
                       lähetyksessä tapahtui virhe")))
          (show-error-message! "Maksatuksen lähetyksessä ongelma" error))
        (let [grant-result (<! (connection/get-grant-payments
                                 (:id @selected-grant)))]
          (if (:success grant-result)
            (reset! payments (:body grant-result))
            (show-error-message!
              "Maksatuksien latauksessa ongelma"
              (select-keys grant-result [:status :error-text])))))
      (put! dialog-chan (+ (count applications-to-send) 10))
      (close! dialog-chan))))

(defn format-date [d]
  (when (some? d)
   (format "%04d-%02d-%02d"
           (.getFullYear d)
           (+ (.getMonth d) 1 )
           (.getDate d))))

(defn convert-payment-dates [values]
  (-> values
      (update :due-date format-date)
      (update :receipt-date format-date)
      (update :invoice-date format-date)))

(defn parse-date [s]
  (-> s
      tf/parse
      tc/to-date))

(defn parse-batch-dates [batch]
  (-> batch
      (update :due-date parse-date)
      (update :receipt-date parse-date)
      (update :invoice-date parse-date)))

(defn notice [message]
  [:div {:style theme/notice} message])

(defn home-page []
  [ui/mui-theme-provider
   {:mui-theme (get-mui-theme (get-mui-theme theme/material-styles))}
   [:div
    (top-links (get @selected-grant :id 0) (router/get-current-path))
    [:hr theme/hr-top]
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
    [:div
     [:div
      [:hr]
      (project-info @selected-grant)
      [:hr]
      [:div
       (or
         (:read-only @batch-values)
         (when-not (some #(< (get-in % [:payment :state]) 2)
                        @current-applications)
          {:style {:opacity 0.2 :pointer-events "none"}}))
       [:h3 "Maksatuksen tiedot"]
       (financing/payment-emails @batch-values
                                 #(swap! batch-values assoc %1 %2))
       (financing/payment-fields @batch-values
                                 #(swap! batch-values assoc %1 %2))]
      [:h3 "Myönteiset päätökset"]
      (applications/applications-table
        {:applications @current-applications
         :on-info-clicked
         (fn [id]
           (let [dialog-chan
                 (show-loading-dialog! "Ladataan historiatietoja" 2)]
             (go
               (put! dialog-chan 1)
               (let [result (<! (connection/get-payment-history id))]
                 (close! dialog-chan)
                 (if (:success result)
                   (show-dialog!
                     "Maksatuksen historia"
                     (r/as-element (payments-ui/render-history (:body result))))
                   (show-error-message!
                     "Virhe historiatietojen latauksessa"
                     (select-keys result [:status :error-text])))))))
         :is-admin? (is-admin? @user-info)})]
     (let [multipayment? (get-in @selected-grant [:content :multiplemaksuera])
           accounts-nil? (some #(when-not (or (get % :lkp-account)
                                              (get % :takp-account)) true)
                               @current-applications)]
       [:div
        (when multipayment?
          (notice "Ainoastaan yhden erän maksatukset on tuettu tällä hetkellä.
             Monen erän maksatukset tulee luoda manuaalisesti."))
        (when accounts-nil?
          (notice "Joillakin hakemuksilla ei ole LKP- tai TaKP-tiliä, joten
                   makastukset tulee luoda manuaalisesti."))
        [ui/raised-button
         {:primary true
          :disabled
          (or
            (not (payments/valid-batch-values? @batch-values))
            multipayment? accounts-nil?)
          :label "Lähetä maksatukset"
          :style theme/button
          :on-click
          (fn [_]
            (go
              (let [batch-result
                    (if (some? (:id @batch-values))
                      {:body @batch-values :success true}
                      (<! (connection/create-payment-batch
                            (-> @batch-values
                                convert-payment-dates
                                (assoc :grant-id (:id @selected-grant))))))
                    batch (:body batch-result)]
                (if (:success batch-result)
                  (send-payments!
                     (filterv #(< (get-in % [:payment :state]) 2)
                              @current-applications)
                     (assoc
                       (select-keys batch
                                    [:acceptor-email
                                    :inspector-email
                                    :batch-number])
                       :state 0
                       :organisation
                       (if (= (:document-type batch) "XB")
                         "6604"
                         "6600")
                       :batch-id (:id batch)))
                  (show-error-message!
                    "Virhe maksuerän luonnissa"
                    batch-result)))))}]])]
    (when (and @delete-payments? (is-admin? @user-info))
      (render-admin-tools))
    (render-dialogs
      @dialogs
      #(do (if (= % :snackbar)
             (swap! dialogs assoc :snackbar {:open false :message ""}))
           (swap! dialogs assoc-in [% :open] false)))]])

(defn mount-root [] (r/render [home-page] (.getElementById js/document "app")))

(defn init! []
  (mount-root)
  (add-watch
    selected-grant
    "s"
    (fn [_ _ ___ new-state]
      (when new-state
        (let [dialog-chan (show-loading-dialog! "Ladataan hakemuksia" 3)]
          (put! dialog-chan 1)
          (go
            (let [grant-id (:id new-state)
                  applications-response
                  (<! (connection/get-grant-applications grant-id))
                  payments-response (<! (connection/get-grant-payments grant-id))
                  batch-response
                  (<! (connection/find-payment-batch
                        grant-id (format-date (js/Date.))))]
              (reset! batch-values
                      (if (= (:status batch-response) 200)
                        (-> (:body batch-response)
                            parse-batch-dates
                            (assoc :read-only true))
                        default-batch-values))
              (put! dialog-chan 2)
              (if (:success applications-response)
                (reset! applications (:body applications-response))
                (show-error-message!
                  "Virhe hakemusten latauksessa"
                  (select-keys applications-response [:status :error-text])))
              (if (:success payments-response)
                (reset! payments (:body payments-response))
                (show-error-message!
                  "Virhe maksatusten latauksessa"
                  (select-keys payments-response [:status :error-text])))
              (put! dialog-chan 3))
            (close! dialog-chan))))))
  (add-watch applications ""
             #(reset! current-applications (payments-ui/combine %4 @payments)))
  (add-watch payments ""
             #(reset! current-applications
                      (payments-ui/combine @applications %4)))
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
                    (show-error-message!
                      "Virhe tietojen latauksessa"
                      (select-keys grants-result [:status :error-text])))))
              (show-error-message!
                "Virhe käyttäjätietojen latauksessa"
                (select-keys user-info-result [:status :error-text])))))
        (show-error-message!
          "Virhe asetusten latauksessa"
          (select-keys config-result [:status :error-text]))
        (put! dialog-chan 3))
      (close! dialog-chan))))
