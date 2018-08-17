(ns oph.va.admin-ui.payments.payments-core
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require
   [cljs.core.async :refer [<! put! close! chan]]
   [clojure.string :refer [join]]
   [oph.va.admin-ui.translations :refer [translate]]
   [oph.va.admin-ui.connection :as connection]
   [reagent.core :as r]
   [oph.va.admin-ui.components.ui :as va-ui]
   [oph.va.admin-ui.payments.payments-ui :as payments-ui]
   [oph.va.admin-ui.payments.payments :as payments]
   [oph.va.admin-ui.router :as router]
   [oph.va.admin-ui.payments.grants-ui :refer [grants-table grant-info]]
   [oph.va.admin-ui.payments.grants
    :refer [flatten-grants]]
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

(defn- update-grant-payments! [id payments]
  (go
    (let [c (dialogs/conn-with-err-dialog!
              "Ladataan maksatuksia"
              "Maksatuksien latauksessa ongelma"
              connection/get-grant-payments
              id)]
      (reset! payments (<! c)))))

(defn get-payment-batch [grant-id]
  (let [c (chan)]
    (go
      (let [bc (dialogs/conn-with-err-dialog!
                 "Ladataan maksuerän tietoja"
                 "Maksuerän latauksessa ongelma"
                 connection/find-payment-batches
                 grant-id (payments/format-date (js/Date.)))]
        (let [batch (<! bc)
              parsed-batch (if (seq batch)
                             (-> batch
                                 last
                                 payments/parse-batch-dates
                                 (assoc :read-only true))
                             default-batch-values)]
          (>! c (assoc parsed-batch :documents
                         (if (some? (:id parsed-batch))
                           (<! (dialogs/conn-with-err-dialog!
                                 "Ladataan maksuerän dokumentteja"
                                 "Dokumenttien latauksessa ongelma"
                                 connection/get-batch-documents
                                 (:id parsed-batch)))
                           []))))))
    c))

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
          (go

            (let [c (dialogs/conn-with-err-dialog!
                      "Poistetaan maksatuksia"
                      "Virhe maksatusten poistossa"
                      connection/delete-grant-payments
                      (:id selected-grant))
                  result (<! c)]
              (when (some? result)
                (update-grant-payments! (:id selected-grant) payments)))))}]
      [:span])
    [va-ui/raised-button
     {:primary true
      :label "Luo maksatukset"
      :style theme/button
      :on-click
      (fn []
        (go
          (let [c (dialogs/conn-with-err-dialog!
                    "Luodaan maksatuksia"
                    "Virhe maksatusten luomisessa"
                    connection/create-grant-payments
                    (:id selected-grant))
                result (<! c)]
            (when (some? result)
              (update-grant-payments! (:id selected-grant) payments)))))}]]])

(defn- render-grant-filters [filter-str on-change]
  [:div
   [va-ui/text-field
    {:floating-label-text "Hakujen suodatus"
     :value filter-str
     :on-change #(on-change (.-value (.-target %)))}]])

(defn- notice [message]
  [va-ui/card {:style theme/notice} [va-ui/card-text message]])

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

(defn- create-batch! [values grant]
  (let [c (chan)]
    (go
      (let [batch-result
            (if (some? (:id values))
              {:body (payments/convert-payment-dates values)
               :success true}
              (<! (connection/create-payment-batch
                    (-> (dissoc values :documents)
                        payments/convert-payment-dates
                        (assoc :grant-id
                               (:id grant))))))
            batch (:body batch-result)]
        (if (:success batch-result)
          (let [last-doc-result
                (loop [docs
                       (filter #(nil? (:created-at %))
                               (:documents values))]
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
              (>! c (assoc batch :documents (:documents values)))
              (do
                (dialogs/show-error-message!
                  "Virhe maksuerän asiakirjan luonnissa"
                  last-doc-result)
                (close! c))))
          (do
            (dialogs/show-error-message!
              "Virhe maksuerän luonnissa"
              batch-result)
            (close! c)))))
    c))

(defn- send-payments-email! [batch-id]
  (go
    (let [dialog-chan (dialogs/show-loading-dialog!
                        "Lähetetään maksatuksia" 3)]
      (put! dialog-chan 1)
      (let [email-result
            (<! (connection/send-payments-email batch-id))]
        (put! dialog-chan 2)
        (if (:success email-result)
          (dialogs/show-message! "Kaikki maksatukset lähetetty")
          (dialogs/show-message!
            "Kaikki maksatukset lähetetty, mutta vahvistussähköpostin
                       lähetyksessä tapahtui virhe")))
      (put! dialog-chan 3)
      (close! dialog-chan))))

(defn- send-payments! [values selected-grant payments]
  (go
    (let [c (dialogs/conn-with-err-dialog!
              "Lähetetään maksatuksia"
              "Maksatusten lähetyksessä ongelma"
              connection/create-batch-payments (:batch-id values))]
      (when (:success (<! c))
        (send-payments-email! (:batch-id values))
        (update-grant-payments! (:id selected-grant) payments)))))

(defn- on-send-payments! [batch-values selected-grant payments]
  (go
    (let [batch (if (some? (:id @batch-values))
                  (payments/convert-payment-dates @batch-values)
                  (<! (create-batch! @batch-values @selected-grant)))]
      (when (some? batch)
        (reset! batch-values
                (payments/parse-batch-dates
                  (assoc batch :read-only true)))
        (send-payments!
          (payments/get-batch-values batch)
          @selected-grant payments)))))

(defn- set-batch-payments-paid! [id grant payments]
  (go
    (let [c (dialogs/conn-with-err-dialog!
              "Päivitetään maksatuksia"
              "Maksatusten päivityksessä ongelma"
              connection/set-batch-payments-state id 2)]
      (when (some? (<! c))
        (update-grant-payments! (:id grant) payments)))))

(defn- on-set-batch-paid! [values grant payments]
  (go
    (let [c (create-batch! values grant)
          batch (<! c)]
      (when (some? batch)
        (set-batch-payments-paid!
          (:id batch)
          grant payments)))))

(defn home-page [data]
  (let [{:keys [user-info delete-payments?]} data
        {:keys [selected-grant batch-values applications payments grants]} state
        flatten-payments (payments/combine @applications @payments)]
    [:div
     [grants-table
      {:grants (flatten-grants @grants)
       :value (:id @selected-grant)
       :on-change (fn [id]
                    (reset! selected-grant
                            (some #(when (= (:id %) id) %)
                                  @grants))
                    (router/set-query! {:grant-id id}))}]

     [:div
      (let [id (:id @selected-grant)]
        [va-ui/tabs {:value "payments"
                     :on-change #(when (not= % "payments")
                                   (router/redirect-to!
                                     (str "/admin/" % "/?avustushaku=" id)))}
         [va-ui/tab {:value "haku-editor"
                     :label "Haun tiedot"}]
         [va-ui/tab {:value "form-editor"
                     :label "Hakulomake"}]
         [va-ui/tab {:value "decision"
                     :label "Päätös"}]
         [va-ui/tab {:value "valiselvitys"
                     :label "Väliselvitys"}]
         [va-ui/tab {:value "loppuselvitys"
                     :label "Loppuselvitys"}]
         [va-ui/tab {:value "payments"
                     :label "Maksatukset"}]])
      [:div
       [:div
        (grant-info @selected-grant)]
       [(fn [data]
          (let [unsent-payments?
                (some? (some #(when (< (:state %) 2) %) flatten-payments))
                new-sent-payments
                (filter #(and (> (:state %) 1)
                              (is-today? (:created-at %))) flatten-payments)]
            [:div {:class
                   (when (not= (:status @selected-grant) "resolved")
                     "disabled")}
             [:div
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
                           {:title (when (:read-only @batch-values)
                                     (translate :batch-modify-not-allowed))}
                           [render-batch-values
                            {:disabled? (or (:read-only @batch-values)
                                            (not unsent-payments?))
                             :values @batch-values
                             :on-change #(swap! batch-values assoc %1 %2)
                             :phases available-phases}]
                           [payments-ui/payments-table
                            outgoing-payments]
                           (let [errors
                                 (concat
                                   (get-batch-errors @payments @batch-values)
                                   (get-grant-errors @selected-grant)
                                   (get-application-errors outgoing-payments))]
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
                                 #(on-send-payments!
                                    batch-values
                                    selected-grant
                                    payments)}]
                               (when (user/is-admin? user-info)
                                 [va-ui/raised-button
                                {:primary true
                                 :disabled
                                 (or
                                   (seq errors)
                                   (not unsent-payments?))
                                 :label (translate :set-paid)
                                 :title (translate :set-paid-without-sending)
                                 :style theme/button
                                 :on-click
                                 #(on-set-batch-paid!
                                    @batch-values
                                    @selected-grant
                                    payments)}])]])]))]]
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
         (render-admin-tools payments @selected-grant delete-payments?))]]]))

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
            (go (reset! batch-values (<! (get-payment-batch grant-id))))))))
    (go
      (let [dialog-chan (dialogs/show-loading-dialog! "Ladataan haun tietoja" 3)
            grants-result (<! (connection/get-grants))]
        (put! dialog-chan 2)
        (if (:success grants-result)
          (do
            (reset! grants (:body grants-result))
            (let [grant-id (or (get-param-grant) (get (first @grants) :id))]
              (when-let [grant (some #(when (= (:id %) grant-id) %) @grants)]
                (reset! selected-grant grant)
                (router/set-query! {:grant-id (:id grant)}))))
          (dialogs/show-error-message!
            "Virhe tietojen latauksessa"
            (select-keys grants-result [:status :error-text])))
        (put! dialog-chan 3)
        (close! dialog-chan)))))
