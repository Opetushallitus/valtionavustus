(ns va-payments-ui.core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
    [reagent.core :as r]
    [cljsjs.material-ui]
    [cljs-react-material-ui.core :refer [get-mui-theme color]]
    [cljs-react-material-ui.reagent :as ui]
    [cljs-react-material-ui.icons :as ic]
    [cljs.core.async :as async]
    [va-payments-ui.payments :refer [create-payments get-payment-data]]
    [va-payments-ui.applications :as applications]
    [va-payments-ui.connection :as connection]
    [va-payments-ui.router :as router]
    [va-payments-ui.grants :refer [grants-table]]
    [va-payments-ui.financing :as financing]
    [va-payments-ui.utils :refer [toggle remove-nil format any-nil?]]))

(defonce grants (r/atom []))

(defonce applications (r/atom []))

(defonce payments (r/atom []))

(defonce selected-grant (r/atom 0))

(defonce user-role (r/atom "presenting_officer"))

(defonce snackbar (r/atom {:open false :message "" }))

(def button-style {:margin 12})

(defn show-message! [message]
  (reset! snackbar {:open true :message message}))

(defn request-with-go [f on-success on-error]
  (go
    (let [response (async/<! (f))]
      (if (:success response)
        (on-success (:body response))
        (on-error (:status response) (:error-text response))))))

(defn get-config [{:keys [on-success on-error]}]
  (request-with-go connection/get-config on-success on-error))

(defn check-session [{:keys [on-success on-error]}]
  (request-with-go connection/check-session on-success on-error))

(defn download-grant-applications [grant-id on-success on-error]
  (request-with-go #(connection/get-grant-applications grant-id)
                  on-success on-error))

(defn download-grants [on-success on-error]
  (request-with-go connection/get-grants-list on-success on-error))

(defn download-grant-payments [grant-id on-success on-error]
  (request-with-go #(connection/get-grant-payments grant-id)
                   on-success on-error))

(defn redirect-to-login! []
  (-> js/window
      .-location
      .-href
     (set! connection/login-url-with-service)))

(defn combine-application-payment [application payment]
  (let [selected-values (select-keys payment [:id :version :state])]
    (merge
      application
      (clojure.set/rename-keys selected-values
                   {:id :payment-id
                    :version :payment-version
                    :state :payment-state}))))

(defn find-application-payment [payments application-id application-version]
  (first
    (filter
      #(and (= (:application-version %) application-version)
            (= (:application-id %) application-id))
      payments)))

(defn combine [applications payments]
  (mapv #(combine-application-payment
           % (find-application-payment payments (:id %) (:version %)))
        applications))

(defn download-grant-data [grant-id on-success on-error]
  (download-grant-applications
    grant-id
    (fn [applications]
      (download-grant-payments
        grant-id
        (fn [payments] (on-success applications payments))
        on-error))
    on-error))

(defn create-application-payments! [applications values on-success on-error]
  (go
    (let [next-i-number-response
          (async/<! (connection/get-next-installment-number))]
      (if (:success next-i-number-response)
        (doseq [application applications]
          (let [new-payment-values
                (assoc values :installment-number
                       (get-in next-i-number-response
                               [:body :installment-number]))
                response (async/<! (connection/create-application-payment
                                     (:id application) new-payment-values))]
            (when-not (:success response)
              (on-error (:status response) (:error-text response)))))
        (on-error (:status next-i-number-response)
                  (:error-text next-i-number-response))))
    (on-success)))

(defn update-payments! [payments on-success on-error]
  (go
    (doseq [payment payments]
      (let [response
            (async/<! (connection/update-payment payment))]
        (when-not (:success response)
          (on-error (:status response) (:error-text response)))))
    (on-success)))

(defn create-grant-payments! [id payments on-success on-error]
  (go
    (let [response (async/<! (connection/create-grant-payments id payments))]
      (if (:success response)
        (on-success)
        (on-error (:status response) (:error-text response))))))

(defn send-payments-email [grant-id on-success on-error]
  (go
    (let [response (async/<! (connection/send-payments-email grant-id))]
      (if (:success response)
        (on-success)
        (on-error (:status response) (:error-text response))))))

(defn top-links [grant-id]
  [:div {:class "top-links"}
   [:a {:href (str "/avustushaku/" grant-id)}
    "Hakemusten arviointi"]
   [:a {:href "/admin/"} "Hakujen hallinta"]
   [:a {:href "/va-payments-ui/payments"} "Maksatusten hallinta"]])

(defn render-applications [applications]
  [:div
   [:h3 "Myönteiset päätökset"]
   (applications/applications-table applications)])

(defn role-select [value on-change]
  [ui/select-field {:value value :floating-label-text "Rooli"
                    :on-change #(on-change %3)}
   [ui/menu-item {:value "presenting_officer" :primary-text "Virkailija"}]
   [ui/menu-item {:value "acceptor" :primary-text "Hyväksyjä"}]
   [ui/menu-item {:value "financials_manager" :primary-text "Taloushallinto"}]])

(defn filter-applications [col role]
  (case role
    "presenting_officer" (filter #(nil? (get % :payment-state)) col)
    "acceptor" (filter #(= (get % :payment-state) 0) col)
    "financials_manager" (filter #(= (get % :payment-state) 1) col)
    col))

(defn show-error-message! [code text]
  (show-message!
    (format "Virhe tietojen latauksessa. Virhe %s (%d)" text code)))

(defn render-presenting-officer [current-applications on-change]
  (let [payment-values (r/atom {})]
    [(fn []
       [:div
        (financing/payment-emails
          @payment-values #(swap! payment-values assoc %1 %2))
        [ui/raised-button
         {:primary true :label "Luo maksatukset" :style button-style
          :disabled (or (empty? current-applications)
                        (any-nil? @payment-values
                                  [:inspector-email
                                   :acceptor-email]))
          :on-click #(on-change @payment-values)}]])]))

(defn render-financials-manager [current-applications on-change]
  (let [payment-values
        (r/atom {:currency "EUR" :payment-term "Z001"
                 :document-type "XA" :organisation "6600"})]
    [(fn []
       [:div
        (financing/payment-fields
          @payment-values #(swap! payment-values assoc %1 %2))
        [ui/raised-button
         {:primary true :label "Lähetä Rondoon"
          :style button-style
          :disabled
          (or (empty? current-applications)
              (any-nil? @payment-values
                        [:transaction-account :due-date :invoice-date :currency
                         :payment-term :document-type :receipt-date]))
          :on-click
          #(on-change
             (mapv remove-nil
                   (get-payment-data
                     current-applications
                     (assoc @payment-values :payment-state 2))))}]])]))


(defn home-page []
  [ui/mui-theme-provider
   {:mui-theme (get-mui-theme
                 {:palette {:text-color (color :black)}})}
   [:div
    (top-links 0)
    (let [current-applications
          (-> @applications
              (combine @payments)
              (filter-applications @user-role))]
      [(fn []
         [:div
          (role-select
            @user-role #(reset! user-role %))
          (grants-table
            {:grants @grants :value @selected-grant
             :on-change
             (fn [row]
               (do (reset! selected-grant row)
                   (when-let [grant (nth @grants row)]
                     (download-grant-data (:id grant)
                        #(do (reset! applications %1) (reset! payments %2))
                        #(show-message! "Virhe tietojen latauksessa")))))})
          (when-let [grant (get @grants @selected-grant)]
            [:div
             (render-applications current-applications)
               [:div
                (when (= @user-role "presenting_officer")
                  (when-let [grant (nth @grants @selected-grant)]
                    (render-presenting-officer
                      current-applications
                      (fn [values]
                        (create-application-payments!
                          current-applications values
                          (fn []
                            (show-message! "Maksatukset luotu")
                            (download-grant-payments
                              (:id grant)
                              (fn [result] (reset! payments result))
                              show-error-message!))
                          (fn [code text]
                            (show-message!
                              "Virhe maksatuksen luonnissa")))))))
                (when (= @user-role "acceptor")
                  [ui/raised-button
                    {:primary true :disabled (empty? current-applications)
                     :label "Ilmoita taloushallintoon" :style button-style
                     :on-click
                     #(update-payments!
                        (mapv remove-nil
                          (get-payment-data
                            current-applications {:payment-state 1}))
                        (fn []
                          (send-payments-email
                            (:id grant)
                            (fn []
                              (do
                                (show-message!
                                  "Ilmoitus taloushallintoon lähetetty")
                                (download-grant-payments
                                 (:id grant)
                                 (fn [result] (reset! payments result))
                                 show-error-message!)))
                            (fn []
                              (show-message!
                                "Virhe sähköpostin lähetyksessä"))))
                        (fn [code ]
                          (show-message! "Virhe maksatuksien päivityksessä")))}])
                (when (= @user-role "financials_manager")
                  (render-financials-manager
                    current-applications
                    (fn [payment-values]
                      (update-payments!
                        payment-values
                        (fn []
                          (show-message! "Maksatukset lähetetty Rondoon")
                          (download-grant-payments
                            (:id grant)
                            (fn [result] (reset! payments result))
                            show-error-message!))
                        (fn [code text]
                          (show-message!
                            "Virhe maksatuksien päivityksessä"))))))]])
           [ui/snackbar
            (conj @snackbar
                  {:auto-hide-duration 4000
                   :on-request-close
                   #(reset! snackbar {:open false :message ""})})]])])]])

(defn mount-root []
  (r/render [home-page] (.getElementById js/document "app")))

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

(defn init! []
  (mount-root)
 (get-config
   {:on-error
    (fn [_ __] (show-message! "Virhe tietojen latauksessa"))
    :on-success
    (fn [config]
       (connection/set-config! config))})
       (check-session
         {:on-success
          (fn [_]
            (download-grants
              (fn [result]
                (do (reset! grants result)
                    (reset! selected-grant
                            (if-let
                              [grant-id (get-param-grant)]
                              (find-index-of @grants #(= grant-id (:id %)))
                             0)))
                (when-let [selected-grant-id
                           (get (nth @grants @selected-grant) :id)]
                  (download-grant-data
                    selected-grant-id
                    #(do (reset! applications %1) (reset! payments %2))
                    #(show-message! "Virhe tietojen latauksessa"))))
              (fn [code text]
                (show-message! "Virhe tietojen latauksessa"))))
          :on-error
          (fn [status _] (when (= status 401) (redirect-to-login!)))}))
