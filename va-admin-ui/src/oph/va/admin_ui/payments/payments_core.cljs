(ns oph.va.admin-ui.payments.payments-core
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require
    [cljs.core.async :refer [<! put! chan close! sliding-buffer]]
    [oph.va.admin-ui.connection :as connection]
    [reagent.core :as r]
    [cljsjs.material-ui]
    [cljs-react-material-ui.core :refer [color]]
    [cljs-react-material-ui.reagent :as ui]
    [cljs-react-material-ui.icons :as ic]
    [oph.va.admin-ui.components.ui :as va-ui]
    [oph.va.admin-ui.payments.payments-ui :as payments-ui]
    [oph.va.admin-ui.payments.payments :as payments]
    [oph.va.admin-ui.payments.applications :as applications]
    [oph.va.admin-ui.router :as router]
    [oph.va.admin-ui.payments.grants-ui :refer [grants-table project-info]]
    [oph.va.admin-ui.payments.grants :refer [grant-matches? remove-old convert-dates]]
    [oph.va.admin-ui.payments.financing :as financing]
    [oph.va.admin-ui.payments.utils :refer
     [remove-nil format no-nils? not-empty? not-nil? find-index-of]]
    [oph.va.admin-ui.dialogs :as dialogs]
    [oph.va.admin-ui.user :as user]
    [oph.va.admin-ui.theme :as theme]
    [cljs-time.format :as tf]
    [cljs-time.coerce :as tc]))

(def default-batch-values
  {:currency "EUR"
   :partner ""
   :document-type "XA"
   :transaction-account "5000"
   :due-date (financing/now-plus financing/week-in-ms)
   :invoice-date (js/Date.)
   :receipt-date (js/Date.)
   :document-id "ID"})

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

(defn render-grant-filters [values on-change]
  [:div
   [va-ui/text-field
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
            "Maksatuksen lähetyksessä ongelma"
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
  [ui/card {:style theme/notice} [ui/card-text message]])

(defn any-account-nil? [a]
  (some?
    (some #(when-not (and (some? (get % :lkp-account))
                          (some? (get % :takp-account))) %) a)))

(defn get-batch-values [batch]
  (assoc
    (select-keys batch
                 [:acceptor-email
                  :inspector-email
                  :batch-number
                  :receipt-date])
    :state 0
    :organisation
    (if (= (:document-type batch) "XB")
      "6604"
      "6600")
    :batch-id (:id batch)))

(defn paid-full? [application]
  (>= (reduce #(+ %1 (:payment-sum %2)) 0 (:payments application))
      (:budget-granted application)))

(defn multibatch-payable? [applications]
  (true?
    (some
      (fn [application]
        (and
          (not (paid-full? application))
          (some (fn [payment] (= (:state payment) 1))
               (:payments application))))
      applications)))

(defn singlebatch-payable? [applications]
  (true?
    (some
      (fn [{:keys [payments]}]
        (or
          (empty? payments)
          (some (fn [payment]
                 (< (:state payment) 2))
               payments)))
      applications)))

(defn home-page [{:keys [selected-grant batch-values applications
                         current-applications payments grants]}
                 {:keys [user-info delete-payments?]}]
  [:div
   [(let [grant-filter (r/atom {:filter-str "" :filter-old true}) ]
      (fn []
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
                           (reset! selected-grant (get filtered-grants row)))}))
         [:hr]
         (project-info @selected-grant)]))]
   [(fn []
      (let [unfilled-payments?
            (true? (some #(or (< (get-in % [:payment :state]) 2))
                         @current-applications))]
        [:div
         [:div
          [:hr]
          [:div
           (when
               (or
                 (:read-only @batch-values)
                 (not unfilled-payments?))
             {:style {:opacity 0.2 :pointer-events "none"}})
           [:h3 "Maksuerän tiedot"]
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
                     (dialogs/show-loading-dialog! "Ladataan historiatietoja" 2)]
                 (go
                   (put! dialog-chan 1)
                   (let [result (<! (connection/get-payment-history id))]
                     (close! dialog-chan)
                     (if (:success result)
                       (dialogs/show-dialog!
                         "Maksatuksen historia"
                         (r/as-element (payments-ui/render-history (:body result))))
                       (dialogs/show-error-message!
                         "Virhe historiatietojen latauksessa"
                         (select-keys result [:status :error-text])))))))
             :is-admin? (user/is-admin? user-info)})]
         (let [accounts-nil? (any-account-nil? @current-applications)]
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
                (not unfilled-payments?))
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
                        batch-result)))))}]])]))
    ]
   (when (and delete-payments? (user/is-admin? user-info))
     (render-admin-tools payments @selected-grant))])

(defn init! [{:keys [selected-grant batch-values applications
                     current-applications payments grants]}]
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
  (add-watch applications ""
             #(reset! current-applications (payments-ui/combine %4 @payments)))
  (add-watch payments ""
             #(reset! current-applications
                      (payments-ui/combine @applications %4)))
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
      (close! dialog-chan))))
