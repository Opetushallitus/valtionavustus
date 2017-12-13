(ns va-payments-ui.core
  (:require
    [reagent.core :as r]
    [cljsjs.material-ui]
    [cljs-react-material-ui.core :refer [get-mui-theme color]]
    [cljs-react-material-ui.reagent :as ui]
    [va-payments-ui.api :as api]
    [va-payments-ui.payments :refer [get-payment-data]]
    [va-payments-ui.applications :as applications]
    [va-payments-ui.connection :as connection]
    [va-payments-ui.router :as router]
    [va-payments-ui.grants :refer [grants-table project-info]]
    [va-payments-ui.financing :as financing]
    [va-payments-ui.utils
     :refer [toggle remove-nil format any-nil? not-empty?]]
    [va-payments-ui.theme :refer [button-style]]))

(defonce grants (r/atom []))

(defonce grant-roles (r/atom {}))

(defonce overridden-role (r/atom nil))

(defonce applications (r/atom []))

(defonce payments (r/atom []))

(defonce selected-grant (r/atom nil))

(defonce user-info (r/atom {}))

(defonce snackbar (r/atom {:open false :message ""}))

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
   [:a {:href "/payments"} "Maksatusten hallinta"]])

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

(defn render-role-operations [role grant current-applications]
  [:div
   (case role
     "presenting_officer"
     (render-presenting-officer
       current-applications
       (fn [values]
         (api/create-application-payments!
           current-applications values
           (fn []
             (show-message! "Maksatukset luotu")
             (api/download-grant-payments
               (:id grant)
               (fn [result] (reset! payments result))
               show-error-message!))
           (fn [_ __]
             (show-message!
               "Virhe maksatuksen luonnissa")))))
     "acceptor"
     [ui/raised-button
      {:primary true :disabled (empty? current-applications)
       :label "Ilmoita taloushallintoon" :style button-style
       :on-click
       #(api/update-payments!
          (mapv remove-nil
            (get-payment-data current-applications {:payment-state 1}))
          (fn []
            (api/send-payments-email
              (:id grant)
              (fn [_]
                (do
                  (show-message! "Ilmoitus taloushallintoon lähetetty")
                  (api/download-grant-payments
                    (:id grant)
                    (fn [result] (reset! payments result))
                    show-error-message!)))
              (fn [_ __] (show-message! "Virhe sähköpostin lähetyksessä"))))
          (fn [_ __]
            (show-message! "Virhe maksatuksien päivityksessä")))}]
     "financials_manager"
     (financing/render-financials-manager
       current-applications
       (fn [payment-values]
         (api/send-xml-invoices!
           {:payments
            payment-values
            :on-success
            (fn []
              (show-message! "Maksatukset lähetetty Rondoon")
              (api/download-grant-payments
                (:id grant)
                (fn [result] (reset! payments result))
                show-error-message!))
            :on-error
            (fn [_ __]
              (show-message!
                "Virhe maksatuksien päivityksessä"))})))
     nil)])

(defn find-role [grant-roles current-grant-id user-oid]
  (loop [i 0]
    (when-let [grant-role (get grant-roles i)]
      (if (and (= (:grant-id grant-role) current-grant-id)
            (= (:oid grant-role) user-oid))
        (:role grant-role)
        (recur (+ i 1))))))

(defn home-page []
  [ui/mui-theme-provider
   {:mui-theme (get-mui-theme
                 {:palette {:text-color (color :black)}})}
   [:div
    (top-links 0)
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
                   #(show-message! "Virhe tietojen latauksessa"))
               (api/get-grant-roles
                 {:grant-id (:id @selected-grant)
                  :on-success #(reset! grant-roles %)
                  :on-error
                  #(show-message! "Virhe roolien latauksessa")})))))})
    (let [user-role
          (or @overridden-role
            (when @selected-grant
              (find-role
                @grant-roles (:id @selected-grant) (:person-oid @user-info))))
          current-applications (-> @applications
                                 (api/combine @payments)
                                 (filter-applications user-role))]
      [(fn []
         [:div
          (when (and @selected-grant (not-empty? user-role))
            [:div
             [:h3 "Myönteiset päätökset"]
             (applications/applications-table current-applications)
             (when @selected-grant
               (render-role-operations
                 user-role @selected-grant current-applications))])
          [ui/snackbar
           (conj @snackbar
             {:auto-hide-duration 4000
              :on-request-close
              #(reset! snackbar {:open false :message ""})})]])])
    [:div
     [:hr]
     (when (some #(= % "va-admin") (:privileges @user-info))
       (let [user-role
             (or @overridden-role
               (when @selected-grant
                 (find-role
                   @grant-roles
                   (:id @selected-grant)
                   (:person-oid @user-info))))]
         (role-select user-role #(reset! overridden-role %))))
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
               :on-error (fn [_ __])}))}]])]]])

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
                   #(show-message! "Virhe tietojen latauksessa"))
               (api/get-grant-roles
                 {:grant-id selected-grant-id
                  :on-success #(reset! grant-roles %)
                  :on-error #(show-message! "Virhe roolien latauksessa")}))))
         (fn [_ __] (show-message! "Virhe tietojen latauksessa"))))}))
