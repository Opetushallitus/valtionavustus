(ns oph.va.admin-ui.payments.payments-core
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require
    [cljs.core.async :refer [<! put! close!]]
    [clojure.string :refer [join]]
    [oph.va.admin-ui.connection :as connection]
    [reagent.core :as r]
    [oph.va.admin-ui.components.ui :as va-ui]
    [oph.va.admin-ui.payments.payments-ui :as payments-ui]
    [oph.va.admin-ui.payments.payments :as payments]
    [oph.va.admin-ui.router :as router]
    [oph.va.admin-ui.payments.grants-ui :refer [grants-table grant-info]]
    [oph.va.admin-ui.payments.grants :refer [grant-matches? convert-dates]]
    [oph.va.admin-ui.payments.financing :as financing]
    [oph.va.admin-ui.payments.utils
     :refer [find-index-of is-today? to-simple-date-time
             to-simple-date phase-to-name]]
    [oph.va.admin-ui.dialogs :as dialogs]
    [oph.va.admin-ui.user :as user]
    [oph.va.admin-ui.theme :as theme]
    [oph.va.admin-ui.components.table :as table]))

(def ^:private default-batch-values
  {:currency "EUR"
   :partner ""
   :due-date (financing/now-plus financing/week-in-ms)
   :invoice-date (js/Date.)
   :receipt-date nil})

(defonce ^:private state
  {:grants (r/atom [])
   :applications (r/atom [])
   :payments (r/atom [])
   :selected-grant (r/atom nil)
   :batch-values (r/atom {})})

(defn- get-param-grant []
  (let [grant-id (js/parseInt (router/get-current-param :grant-id))]
    (when-not (js/isNaN grant-id) grant-id)))

(defn- render-admin-tools [payments selected-grant delete-payments?]
  [:div {:class (when (nil? selected-grant) "disabled")}
   [:hr]
   [:h3 "Pääkäyttäjän työkalut"]
   [:div
    (if delete-payments?
      [va-ui/raised-button
       {:primary true
        :label "Poista maksatukset"
        :style theme/button
        :on-click
        (fn []
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
                                 [:status :error-text]))))))}]
      [:span])
    [va-ui/raised-button
     {:primary true
      :label "Luo maksatukset"
      :style theme/button
      :on-click
      (fn []
        (go (let [grant-id (:id selected-grant)
                  response (<! (connection/create-grant-payments
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
                  "Virhe maksatusten luonnissa"
                  (select-keys response
                               [:status :error-text]))))))}]]])

(defn- render-grant-filters [filter-str on-change]
  [:div
   [va-ui/text-field
    {:floating-label-text "Hakujen suodatus"
     :value filter-str
     :on-change #(on-change (.-value (.-target %)))}]])

(defn- send-payments! [values selected-grant payments]
  (go
    (let [dialog-chan
          (dialogs/show-loading-dialog!
            "Lähetetään maksatuksia" 6)]
      (put! dialog-chan 1)
      (let [result (<! (connection/create-batch-payments (:batch-id values)))]
        (put! dialog-chan 2)
        (if (and (:success result) (get-in result [:body :success]))
          (let [email-result
                (<! (connection/send-payments-email (:batch-id values)))]
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
                (payments/get-error-messages "Maksatusten lähetyksessä ongelma")
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

(defn- notice [message]
  [va-ui/card {:style theme/notice} [va-ui/card-text message]])

(defn- grants-components []
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

(defn render-document [i document on-delete]
  [table/table-row {:key i}
   [table/table-row-column
    (phase-to-name (:phase document))]
   [table/table-row-column
    (:document-id document)]
   [table/table-row-column
    (:presenter-email document)]
   [table/table-row-column
    (:acceptor-email document)]
   [table/table-row-column
    (when (seq (:created-at document))
      (to-simple-date (:created-at document)))]
   [table/table-row-column
    (when-not (seq (:created-at document))
      [va-ui/raised-button
       {:label "Poista"
        :primary true
        :on-click #(on-delete i)}])]])

(defn- removev [coll i]
  (into (subvec coll 0 i)
        (subvec coll (inc i))))

(defn- render-batch-values
  [{:keys [values disabled? on-change phases]}]
  [:div {:class (when disabled? "disabled")}
   [:h3 "Maksuerän tiedot"]
   [financing/payment-batch-fields
    {:values values :on-change #(on-change %1 %2)}]
   [:div
    [table/table
     [table/table-header
      [table/table-row
       [table/table-header-column "Vaihe"]
       [table/table-header-column "ASHA tunniste"]
       [table/table-header-column "Esittelijän sähköposti"]
       [table/table-header-column "Hyväksyjän sähköposti"]
       [table/table-header-column "Lisätty"]
       [table/table-header-column]]]
     [table/table-body
      (doall
        (map-indexed
          (fn [i doc]
            (render-document
              i doc
              #(on-change :documents (removev (get values :documents []) i))))
          (:documents values)))]]]
   [:div
    {:class (when (empty? phases) "disabled")}
    [financing/document-field
     {:phases phases
      :on-change
      #(on-change :documents (conj (get values :documents []) %))}]]])

(defn- find-available-phases [payments documents]
  (clojure.set/difference
    (set (map :phase payments))
    (set (map :phase documents))))

(defn- get-application-errors [applications]
  (cond-> []
    (some #(when (nil? (:lkp-account %)) true) applications)
    (merge "LKP-tili puuttuu joltain hakemukselta")
    (some #(when (nil? (:takp-account %)) true) applications)
    (merge "TaKP-tili puuttuu joltain hakemukselta")))

(defn- get-batch-errors [payments batch-values]
  (cond-> []
    (seq (find-available-phases
           payments
           (:documents batch-values)))
    (merge "Kaikille vaiheille ei ole lisätty asiakirjaa")
    (nil? (:receipt-date batch-values)) (merge "Tositepäivämäärä puuttuu")
    (nil? (:due-date batch-values)) (merge "Eräpäivä puuttuu")
    (nil? (:invoice-date batch-values)) (merge "Laskun päivämäärä puuttuu")))

(defn- get-grant-errors [grant]
  (cond-> []
    (nil? (get grant :operational-unit))
    (merge "Avustushaun toimintayksikkö puuttuu")
    (nil? (get grant :project))
    (merge "Avustushaun Projekti puuttuu")
    (nil? (get grant :operation))
    (merge "Avustushaun Toiminto puuttuu")
    (nil? (get-in grant [:content :transaction-account]))
    (merge "Avustushaun Maksuliikemenotili puuttuu")
    (nil? (get-in grant [:content :document-type]))
    (merge "Avustushaun tositelaji puuttuu")))

(defn home-page [data]
  (let [{:keys [user-info delete-payments?]} data
        {:keys [selected-grant batch-values applications payments]} state
        flatten-payments (payments/combine @applications @payments)]
    [:div
     [grants-components]
     [(fn [data]
        (let [unsent-payments?
              (some? (some #(when (< (:state %) 2) %) flatten-payments))
              new-sent-payments
              (filter #(and (> (:state %) 1)
                            (is-today? (:created-at %))) flatten-payments)]
          [:div {:class
                 (when (not= (:status @selected-grant) "resolved") "disabled")}
           [:div
            [:hr]
            [(let [selected (r/atom "outgoing")]
               (fn [data]
                 [va-ui/tabs {:value @selected
                              :on-change #(reset! selected %)}
                  [va-ui/tab
                   {:value "outgoing"
                    :label "Lähtevät maksatukset"}
                   [(let [outgoing-payments
                          (filter #(< (:state %) 2) flatten-payments)
                          available-phases
                          (find-available-phases
                            outgoing-payments
                            (get @batch-values :documents []))]
                      (fn [data]
                        [:div
                         [render-batch-values
                          {:disabled? (not unsent-payments?)
                           :values @batch-values
                           :on-change #(swap! batch-values assoc %1 %2)
                           :phases available-phases}]
                         [payments-ui/payments-table
                          outgoing-payments]
                         (let [errors (concat
                                        (get-batch-errors @payments @batch-values)
                                        (get-grant-errors @selected-grant)
                                        (get-application-errors @applications))]
                           [:div
                            (when (and (seq outgoing-payments) (seq errors))
                              (notice
                                [:div
                                 [:h3
                                  "Seuraavat puutteet estävät
                             maksatusten lähetyksen"]
                                 (doall
                                   (map-indexed
                                     (fn [i e] [:div {:key i} e])
                                     errors))]))
                            [:div
                             [va-ui/raised-button
                              {:primary true
                               :disabled
                               (or
                                 (seq errors)
                                 (not unsent-payments?))
                               :label "Lähetä maksatukset"
                               :style theme/button
                               :on-click
                               (fn [_]
                                 (go
                                   (let [batch-result
                                         (if (some? (:id @batch-values))
                                           {:body (payments/convert-payment-dates
                                                    @batch-values)
                                            :success true}
                                           (<! (connection/create-payment-batch
                                                 (-> (dissoc @batch-values :documents)
                                                     payments/convert-payment-dates
                                                     (assoc :grant-id
                                                            (:id @selected-grant))))))
                                         batch (:body batch-result)]
                                     (if (:success batch-result)
                                       (let [last-doc-result
                                             (loop [docs
                                                    (filter #(nil? (:created-at %))
                                                            (:documents @batch-values))]
                                               (if (empty? docs)
                                                 {:success true}
                                                 (let [doc-result
                                                       (<!
                                                         (connection/send-batch-document
                                                           (:id batch)
                                                           (dissoc (first docs)
                                                                   :created-at)))]
                                                   (if-not (:success doc-result)
                                                     doc-result
                                                     (recur (rest docs))))))]
                                         (if (:success last-doc-result)
                                           (send-payments!
                                             (payments/get-batch-values batch)
                                             @selected-grant payments)
                                           (dialogs/show-error-message!
                                             "Virhe maksuerän asiakirjan luonnissa"
                                             last-doc-result)))
                                       (dialogs/show-error-message!
                                         "Virhe maksuerän luonnissa"
                                         batch-result)))))}]]])]))]]
                  [va-ui/tab
                   {:value "sent"
                    :label [:span
                            "Lähetetyt maksatukset"
                            (when (not (empty? new-sent-payments))
                              [va-ui/badge
                               (str (count new-sent-payments) " uutta")])]}
                   [payments-ui/payments-table
                    (filter #(> (:state %) 1) flatten-payments)]]]))]]]))]
     (when (user/is-admin? user-info)
       (render-admin-tools payments @selected-grant delete-payments?))]))

(defn init! []
  (let [{:keys [selected-grant batch-values applications payments grants]}
        state]
    (add-watch
      selected-grant
      "s"
      (fn [_ _ ___ new-state]
        (when new-state
          (let [grant-id (:id new-state)]
            (let [dialog-chan (dialogs/show-loading-dialog!
                                "Ladataan hakemuksia" 3)]
              (go
                (let [applications-response
                      (<! (connection/get-grant-applications grant-id))]
                  (put! dialog-chan 2)
                  (if (:success applications-response)
                    (reset! applications (:body applications-response))
                    (dialogs/show-error-message!
                      "Virhe hakemusten latauksessa"
                      (select-keys applications-response
                                   [:status :error-text])))
                  (put! dialog-chan 3))
                (close! dialog-chan)))

            (let [dialog-chan (dialogs/show-loading-dialog!
                                "Ladataan maksatuksia" 3)]
              (put! dialog-chan 1)
              (go
                (let [payments-response (<! (connection/get-grant-payments
                                              grant-id))]
                  (put! dialog-chan 2)
                  (if (:success payments-response)
                    (reset! payments (:body payments-response))
                    (dialogs/show-error-message!
                      "Virhe maksatusten latauksessa"
                      (select-keys payments-response [:status :error-text]))))
                (put! dialog-chan 3)
                (close! dialog-chan)))
            (let [dialog-chan (dialogs/show-loading-dialog!
                                "Ladataan maksuerän tietoja" 3)]
              (put! dialog-chan 1)
              (go
                (let [batch-response
                      (<! (connection/find-payment-batches
                            grant-id (payments/format-date (js/Date.))))]
                  (put! dialog-chan 2)
                  (reset! batch-values
                          (if (and
                                (= (:status batch-response) 200)
                                (seq (:body batch-response)))
                            (-> (:body batch-response)
                                last
                                payments/parse-batch-dates
                                (assoc :read-only true))
                            default-batch-values)))
                (put! dialog-chan 3)
                (close! dialog-chan)
                (when (some? (:id @batch-values))
                  (let [doc-dialog-chan (dialogs/show-loading-dialog!
                                          "Ladataan maksuerän dokumentteja" 3)]
                    (put! doc-dialog-chan 1)
                    (go
                      (let [doc-response
                            (<! (connection/get-batch-documents
                                  (:id @batch-values)))]
                        (put! doc-dialog-chan 2)
                        (swap! batch-values
                               assoc :documents (:body doc-response)))
                      (put! doc-dialog-chan 3)
                      (close! doc-dialog-chan))))))))))
    (go
      (let [dialog-chan (dialogs/show-loading-dialog! "Ladataan haun tietoja" 3)
            grants-result (<! (connection/get-grants))]
        (put! dialog-chan 2)
        (if (:success grants-result)
          (do
            (reset! grants (convert-dates (:body grants-result)))
            (when-let [grant-id (get-param-grant)]
              (when-let [grant (some #(when (= (:id %) grant-id) %) @grants)]
                (reset! selected-grant grant))))
          (dialogs/show-error-message!
            "Virhe tietojen latauksessa"
            (select-keys grants-result [:status :error-text])))
        (put! dialog-chan 3)
        (close! dialog-chan)))))
