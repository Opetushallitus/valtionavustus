(ns va-payments-ui.core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [cljs.core.async :refer [<!]]
            [clojure.string :refer [lower-case includes?]]
            [va-payments-ui.connection :as connection]
            [reagent.core :as r]
            [cljsjs.material-ui]
            [cljs-react-material-ui.core :refer [get-mui-theme color]]
            [cljs-react-material-ui.reagent :as ui]
            [va-payments-ui.payments :as payments]
            [va-payments-ui.applications :as applications]
            [va-payments-ui.connection :as connection]
            [va-payments-ui.router :as router]
            [va-payments-ui.grants :refer [grants-table project-info]]
            [va-payments-ui.financing :as financing]
            [va-payments-ui.utils :refer
             [toggle remove-nil format no-nils? not-empty? not-nil?]]
            [va-payments-ui.theme :as theme]))

(defonce grants (r/atom []))

(defonce applications (r/atom []))

(defonce payments (r/atom []))

(defonce selected-grant (r/atom nil))

(defonce user-info (r/atom {}))

(defonce snackbar (r/atom {:open false :message ""}))

(defonce dialog (r/atom {:open false}))

(defonce delete-payments? (r/atom false))

(defonce grant-filter (r/atom ""))

(defn show-message! [message] (reset! snackbar {:open true :message message}))

(defn show-error-message!
  [code text]
  (show-message!
    (format "Virhe tietojen latauksessa. Virhe %s (%d)" text code)))

(defn redirect-to!
  [url]
  (-> js/window
      .-location
      .-href
      (set! url)))

(defn redirect-to-login! [] (redirect-to! connection/login-url-with-service))

(defn find-index-of
  ([col pred i m]
   (if (>= i m) nil (if (pred (nth col i)) i (recur col pred (inc i) m))))
  ([col pred] (find-index-of col pred 0 (count col))))

(defn get-param-grant
  []
  (let [grant-id (js/parseInt (router/get-current-param :grant))]
    (when-not (js/isNaN grant-id) grant-id)))

(defn create-link
  [href title active]
  [:a {:href href :style (if active theme/active-link theme/link)} title])

(defn top-links
  [grant-id current-path]
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
     {:label "Kirjaudu ulos" :on-click #(redirect-to! "/login/logout")}]]])

(defn show-dialog! [content] (swap! dialog assoc :open true :content content))

(defn render-admin-tools
  []
  [:div [:hr]
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

(defn valid-payment-values?
  [values]
  (and (no-nils? values
                 [:transaction-account :due-date :invoice-date :payment-term
                  :document-type :receipt-date])
       (financing/valid-email? (:inspector-email values))
       (financing/valid-email? (:acceptor-email values))))

(defn grant-matches?
  [g s]
  (if (empty? s)
    true
    (let [s-lower (lower-case s)]
      (or (includes? (:register-number g) s-lower)
          (includes? (lower-case (get-in g [:content :name :fi])) s-lower)))))

(defn is-admin?
  [user]
  (not-nil? (some #(= % "va-admin") (get user :privileges))))

(add-watch
  selected-grant
  "s"
  (fn [k reference old-state new-state]
    (when new-state
      (go (let [grant-id (:id new-state)
                applications-response (<! (connection/get-grant-applications
                                            grant-id))
                payments-response (<! (connection/get-grant-payments grant-id))]
            (if (:success applications-response)
              (reset! applications (:body applications-response))
              (show-message! "Virhe hakemusten latauksessa"))
            (if (:success payments-response)
              (reset! payments (:body payments-response))
              (show-message! "Virhe maksatusten latauksessa")))))))

(defn home-page
  []
  [ui/mui-theme-provider
   {:mui-theme (get-mui-theme (get-mui-theme theme/material-styles))}
   [:div (top-links (get @selected-grant :id 0) (router/get-current-path)) [:hr]
    [:div
     [ui/text-field
      {:floating-label-text "Hakujen suodatus"
       :value @grant-filter
       :on-change #(reset! grant-filter (.-value (.-target %)))}]
     (let [filtered-grants (filterv #(grant-matches? % @grant-filter) @grants)]
       (grants-table
         {:grants filtered-grants
          :value (find-index-of filtered-grants
                                #(= (:id %) (:id @selected-grant)))
          :on-change (fn [row]
                       (reset! selected-grant (get filtered-grants row)))}))]
    (let [current-applications (-> @applications
                                   (payments/combine @payments))
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
          [:div [:hr] (project-info @selected-grant) [:hr]
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
                        (show-dialog! (r/as-element (payments/render-history
                                                      (:body result))))
                        (show-message! "Virhe historiatietojen latauksessa")))))
              :is-admin? (is-admin? @user-info)})]
          [ui/raised-button
           {:primary true
            :disabled (not (valid-payment-values? @payment-values))
            :label "Lähetä maksatukset"
            :style theme/button
            :on-click
              (fn [_]
                (go (let [applications-to-send
                            (filter #(< (get % :payment-state) 2)
                              current-applications)
                          nin-result
                            (<! (connection/get-next-installment-number))]
                      (if (:success nin-result)
                        (let [values (conj @payment-values (:body nin-result))]
                          (doseq [application applications-to-send]
                            (let [payment-result (<! (connection/create-payment
                                                       (assoc values
                                                         :application-id
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
                  :on-request-close #(reset! snackbar
                                             {:open false :message ""})})]])])
    (when (and @delete-payments? (is-admin? @user-info)) (render-admin-tools))
    [ui/dialog
     {:on-request-close #(swap! dialog assoc :open false)
      :children (:content @dialog)
      :open (:open @dialog)
      :content-style {:width "95%" :max-width "none"}}]]])

(defn mount-root [] (r/render [home-page] (.getElementById js/document "app")))

(defn init!
  []
  (mount-root)
  (go
    (let [config-result (<! (connection/get-config))]
      (if (:success config-result)
        (do
          (reset! delete-payments?
                  (get-in config-result [:body :payments :delete-payments?]))
          (connection/set-config! (:body config-result))
          (let [user-info-result (<! (connection/get-user-info))]
            (if (:success user-info-result)
              (do
                (reset! user-info (:body user-info-result))
                (let [grants-result (<! (connection/get-grants))]
                  (if (:success grants-result)
                    (do
                      (reset! grants (:body grants-result))
                      (reset! selected-grant
                              (if-let [grant-id (get-param-grant)]
                                (first (filter #(= (:id %) grant-id) @grants))
                                (first @grants)))
                      (when-let [selected-grant-id (:id @selected-grant)]
                        (let [applications-response
                                (<! (connection/get-grant-applications
                                      selected-grant-id))
                              payments-response (<!
                                                  (connection/get-grant-payments
                                                    selected-grant-id))]
                          (if (:success applications-response)
                            (reset! applications (:body applications-response))
                            (show-message! "Virhe hakemusten latauksessa"))
                          (if (:success payments-response)
                            (reset! payments (:body payments-response))
                            (show-message! "Virhe maksatusten latauksessa")))))
                    (show-message! "Virhe tietojen latauksessa"))))
              (show-message! "Virhe käyttäjätietojen latauksessa"))))
        (show-message! "Virhe asetusten latauksessa")))))
