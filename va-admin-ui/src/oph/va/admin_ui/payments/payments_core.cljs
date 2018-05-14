(ns oph.va.admin-ui.payments.payments-core
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require
    [cljs.core.async :refer [<! put! chan close! sliding-buffer]]
    [clojure.string :refer [join]]
    [oph.va.admin-ui.connection :as connection]
    [reagent.core :as r]
    [cljsjs.material-ui]
    [cljs-react-material-ui.core :refer [color]]
    [cljs-react-material-ui.reagent :as ui]
    [cljs-react-material-ui.icons :as ic]
    [oph.va.admin-ui.components.ui :as va-ui]
    [oph.va.admin-ui.payments.payments-ui :as payments-ui]
    [oph.va.admin-ui.payments.payments :as payments
     :refer [multibatch-payable? singlebatch-payable? any-account-nil?
             convert-payment-dates get-batch-values format-date
             parse-batch-dates get-error-messages combine]]
    [oph.va.admin-ui.payments.applications :as applications]
    [oph.va.admin-ui.router :as router]
    [oph.va.admin-ui.payments.grants-ui :refer [grants-table grant-info]]
    [oph.va.admin-ui.payments.grants :refer [grant-matches? convert-dates]]
    [oph.va.admin-ui.payments.financing :as financing]
    [oph.va.admin-ui.payments.utils :refer [find-index-of]]
    [oph.va.admin-ui.dialogs :as dialogs]
    [oph.va.admin-ui.user :as user]
    [oph.va.admin-ui.theme :as theme]))

(def default-batch-values
  {:currency "EUR"
   :partner ""
   :document-type "XA"
   :transaction-account "5000"
   :due-date (financing/now-plus financing/week-in-ms)
   :invoice-date (js/Date.)
   :receipt-date nil
   :document-id "ID"})

(defonce state
  {:grants (r/atom [])
   :applications (r/atom [])
   :payments (r/atom [])
   :selected-grant (r/atom nil)
   :batch-values (r/atom {})})

(defn redirect-to-login! []
  (router/redirect-to! connection/login-url-with-service))

(defn get-param-grant []
  (let [grant-id (js/parseInt (router/get-current-param :grant))]
    (when-not (js/isNaN grant-id) grant-id)))

(defn render-admin-tools [payments selected-grant]
  [:div
   [:hr]
   [ui/grid-list {:cols 6 :cell-height "auto"}
    [va-ui/raised-button
     {:primary true
      :label "Poista maksatukset"
      :style theme/button
      :on-click (fn []
                  (go (let [grant-id (:id selected-grant)
                            response (<! (connection/delete-grant-payments
                                           grant-id))]
                        (if (:success response)
                          (let [download-response
                                  (<! (connection/get-grant-payments grant-id))]
                            (if (:success download-response)
                              (reset! payments (:body download-response))
                              (dialogs/show-error-message!
                                "Virhe tietojen latauksessa"
                                (select-keys download-response
                                             [:status :error-text]))))
                          (dialogs/show-error-message!
                            "Virhe maksatusten poistossa"
                            (select-keys response
                                         [:status :error-text]))))))}]]])

(defn render-grant-filters [filter-str on-change]
  [:div
   [va-ui/text-field
    {:floating-label-text "Hakujen suodatus"
     :value filter-str
     :on-change #(on-change (.-value (.-target %)))}]
   [ui/icon-button {:on-click #(on-change "")}
    [ic/action-highlight-off {:color "gray"}]]])

(defn send-payments! [values selected-grant payments]
  (go
    (let [dialog-chan
          (dialogs/show-loading-dialog!
            "Lähetetään maksatuksia" 6)]
      (put! dialog-chan 1)
      (let [result (<! (connection/create-batch-payments (:batch-id values)))]
        (put! dialog-chan 2)
        (if (and (:success result) (get-in result [:body :success]))
          (let [email-result
                (<!
                  (connection/send-payments-email
                    (:id selected-grant)
                    (select-keys values [:acceptor-email
                                         :inspector-email
                                         :organisation
                                         :batch-number
                                         :batch-id
                                         :receipt-date])))]
            (put! dialog-chan 3)
            (if (:success email-result)
              (dialogs/show-message! "Kaikki maksatukset lähetetty")
              (dialogs/show-message!
                "Kaikki maksatukset lähetetty, mutta vahvistussähköpostin
                       lähetyksessä tapahtui virhe")))
          (dialogs/show-error-message!
            (-> result
                (get-in [:body :errors])
                distinct
                (get-error-messages "Maksatusten lähetyksessä ongelma")
                distinct
                join)
            (select-keys result [:status :error-text])))
        (let [grant-result (<! (connection/get-grant-payments
                                 (:id selected-grant)))]
          (put! dialog-chan 4)
          (if (:success grant-result)
            (reset! payments (:body grant-result))
            (dialogs/show-error-message!
              "Maksatuksien latauksessa ongelma"
              (select-keys grant-result [:status :error-text])))))
      (put! dialog-chan 5)
      (close! dialog-chan))))

(defn notice [message]
  [ui/card {:style theme/notice} [ui/card-text message]])

(defn grants-components []
  (let [grant-filter (r/atom "")
        {:keys [grants selected-grant]} state]
    (fn []
      [:div
       (render-grant-filters @grant-filter #(reset! grant-filter %))
       (let [filtered-grants
             (filterv #(grant-matches? % @grant-filter) @grants)]
         (grants-table
           {:grants filtered-grants
            :value (find-index-of filtered-grants
                                  #(= (:id %) (:id @selected-grant)))
            :on-change (fn [row]
                         (reset! selected-grant (get filtered-grants row)))}))
       [:hr]
       (grant-info @selected-grant)])))

(defn home-page [{:keys [user-info delete-payments?]}]
  (let [{:keys [selected-grant batch-values applications payments]} state
        flatten-payments (combine @applications @payments)]
    [:div
     [grants-components]
     [(fn []
        (let [unsent-payments? (some #(when (< (:state %) 2)) flatten-payments)]
          [:div
           [:div
            [:hr]
            [(let [selected (r/atom "outgoing")]
               (fn []
                 [va-ui/tabs {:value @selected
                              :on-change #(reset! selected %)}
                  [va-ui/tab
                   {:value "outgoing"
                    :label "Lähtevät maksatukset"}
                   [:h3 "Maksuerän tiedot"]
                   (financing/payment-emails @batch-values
                                             #(swap! batch-values assoc %1 %2))
                   (financing/payment-fields @batch-values
                                             #(swap! batch-values assoc %1 %2))
                   [payments-ui/payments-table
                    (filter #(< (:state %) 2) flatten-payments)]]
                  [va-ui/tab
                   {:value "sent"
                    :label "Lähetetyt maksatukset"}
                   [payments-ui/payments-table
                    (filter #(> (:state %) 1) flatten-payments)]]]))]]
           (let [accounts-nil? (any-account-nil? @applications)]
             [:div
              (when accounts-nil?
                (notice "Joillakin hakemuksilla ei ole LKP- tai TaKP-tiliä, joten
                   makastukset tulee luoda manuaalisesti."))
              [va-ui/raised-button
               {:primary true
                :disabled
                (or
                  (not (payments/valid-batch-values? @batch-values))
                  accounts-nil?
                  (not unsent-payments?))
                :label "Lähetä maksatukset"
                :style theme/button
                :on-click
                (fn [_]
                  (go
                    (let [batch-result
                          (if (some? (:id @batch-values))
                            {:body (convert-payment-dates @batch-values)
                             :success true}
                            (<! (connection/create-payment-batch
                                  (-> @batch-values
                                      convert-payment-dates
                                      (assoc :grant-id (:id @selected-grant))))))
                          batch (:body batch-result)]
                      (if (:success batch-result)
                        (send-payments!
                          (get-batch-values batch)
                          @selected-grant payments)
                        (dialogs/show-error-message!
                          "Virhe maksuerän luonnissa"
                          batch-result)))))}]])]))]
     (when (and delete-payments? (user/is-admin? user-info))
       (render-admin-tools payments @selected-grant))]))

(defn init! []
  (let [{:keys [selected-grant batch-values applications payments grants]} state]
   (add-watch
     selected-grant
     "s"
     (fn [_ _ ___ new-state]
       (when new-state
         (let [dialog-chan (dialogs/show-loading-dialog! "Ladataan hakemuksia" 3)]
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
                 (dialogs/show-error-message!
                   "Virhe hakemusten latauksessa"
                   (select-keys applications-response [:status :error-text])))
               (if (:success payments-response)
                 (reset! payments (:body payments-response))
                 (dialogs/show-error-message!
                   "Virhe maksatusten latauksessa"
                   (select-keys payments-response [:status :error-text])))
               (put! dialog-chan 3))
             (close! dialog-chan))))))
   (go
     (let [dialog-chan (dialogs/show-loading-dialog! "Ladataan haun tietoja" 3)
           grants-result (<! (connection/get-grants))]
       (put! dialog-chan 2)
       (if (:success grants-result)
         (do
           (reset! grants (convert-dates (:body grants-result)))
           (reset! selected-grant
                   (if-let [grant-id (get-param-grant)]
                     (first (filter #(= (:id %) grant-id) @grants))
                     (first @grants))))
         (dialogs/show-error-message!
           "Virhe tietojen latauksessa"
           (select-keys grants-result [:status :error-text])))
       (put! dialog-chan 3)
       (close! dialog-chan)))))
