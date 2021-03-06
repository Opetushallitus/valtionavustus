(ns oph.va.admin-ui.search.search-core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [reagent.core :as r]
   [oph.va.admin-ui.components.ui :as va-ui]
   [oph.va.admin-ui.theme :as theme]
   [oph.va.admin-ui.payments.utils :refer [to-simple-date-time]]
   [oph.va.admin-ui.connection :as connection]
   [oph.va.admin-ui.router :as router]
   [cljs-react-material-ui.reagent :as ui]
   [oph.va.admin-ui.dialogs :as dialogs]))

(defonce ^:private search-results
  {:grants (r/atom [])
   :applications (r/atom [])})

(defonce ^:private state
  (r/atom {:grants-searching false
           :applications-searching false
           :term-length-error false}))

(def ^:private max-str-len 60)

(def state-str
  {"unhandled" "Käsittelemättä"
   "processing" "Käsittelyssä"
   "plausible" "Mahdollinen"
   "rejected" "Hylätty"
   "accepted" "Hyväksytty"})

(defn- shrink [s]
  (if (> (count s) (- max-str-len 3))
    (str (subs s 0 max-str-len) "...")
    s))

(defn- search-items [params]
  (swap! state assoc :grants-searching true :applications-searching true)
  (router/set-query! {:search (:search params) :order (:order params)})
  (go
    (let [result (<! (connection/find-grants params))]
      (if (:success result)
        (reset! (:grants search-results) (:body result))
        (dialogs/show-error-message!
          "Virhe hakujen etsimisessä"
          (select-keys result [:status :error-text])))
      (swap! state assoc :grants-searching false)))
  (go
    (let [result (<! (connection/find-applications params))]
      (if (:success result)
        (reset! (:applications search-results) (:body result))
        (dialogs/show-error-message!
          "Virhe hakemusten etsimisessä"
          (select-keys result [:status :error-text])))
      (swap! state assoc :applications-searching false))))

(defn- render-result-item [i link title & content]
  [:div {:key i}
   [:h3
    [:a {:href link :target "_blank"}
     [:span {:class "search-result-title"}
      (shrink title)]]]
   (apply vector :div content)])

(defn- format-title [grant]
  (str (when (seq (:register-number grant))
         (str (:register-number grant) " - "))
       (get-in grant [:content :name :fi])))

(defn- format-duration [duration]
  (str (when (some? (:start duration)) (to-simple-date-time (:start duration)))
         " - "
         (when (some? (:end duration)) (to-simple-date-time (:end duration)))))

(defn- render-grant [i grant]
  (render-result-item
    i
    (str "/avustushaku/" (:id grant) "/")
    (format-title grant)
    (format-duration (get-in grant [:content :duration]))))

(defn- item-row [title value]
  [:div
     [:label
      {:style {:font-weight "bold" :padding-right 5}}
      title ": "]
   (or value "-")])

(defn- render-application [i application]
  (render-result-item
    i
    (str "/avustushaku/"
         (:grant-id application) "/hakemus/"
         (or (:parent-id application) (:id application)) "/")
    (str (get application :register-number)
         " - "
         (:organization-name application))
    (item-row "Avustushaku" (:grant-name application))
    (when (seq (:project-name application))
      (item-row "Hanke" (:project-name application)))
    (item-row "Hakemusta päivitetty"
              (to-simple-date-time (:created-at application)))
    (item-row "Haettu summa" (:budget-oph-share application))
    (item-row "Myönnetty summa"
              (get-in application [:evaluation :budget-granted]))
    (item-row "Koulutusaste"
              (get-in application [:evaluation :rahoitusalue]))
    (item-row "Talousarviotili"
              (get-in application [:evaluation :talousarviotili]))
    (item-row "Tila"
              (get state-str (get-in application [:evaluation :status])))
    (when-not (get-in application [:evaluation :should-pay])
      (item-row "Avustusta ei makseta"
                (get-in application [:evaluation :should-pay-comments])))
    (when (:refused application)
      (item-row
        "Ei ota vastaan"
        (:refused-comment application)))))

(defn- render-search [results title renderer searching?]
  [:div
   [:h2 title]
   (if searching?
     [ui/circular-progress]
     (if (pos? (count results))
       (doall (map-indexed renderer results))
       [:span "Ei hakutuloksia"]))])

(defn- search-field [props]
  (let [search-params (r/atom {:search (:default-value props)
                               :order (if (seq (:default-order props))
                                        (:default-order props)
                                        "created-at-desc")})]
    (fn [{:keys [error on-change]}]
      [:div
       [va-ui/text-field
        {:placeholder "Hakusanan pituus tulee olla yli kolme merkkiä"
         :error error
         :on-change #(swap! search-params assoc :search (-> % .-target .-value))
         :value (:search @search-params)
         :on-enter-pressed #(on-change @search-params)
         :style (assoc theme/text-field :width 575)}]
       [va-ui/select-field
        {:value (:order @search-params)
         :on-change (fn [v]
                      (swap! search-params assoc :order v)
                      (on-change @search-params))
         :values [{:value "created-at-desc" :primary-text "Uusin ensin"}
                  {:value "created-at-asc" :primary-text "Vanhin ensin"}]}]])))

(defn home-page []
  [:div
   [search-field
    {:default-value
     (js/decodeURIComponent
       (or
         (router/get-param (router/get-current-query) :search)
         ""))
     :default-order
     (js/decodeURIComponent
       (or
         (router/get-param (router/get-current-query) :order)
         ""))
     :error (:term-length-error @state)
     :on-change
     #(if (> (count (:search %)) 3)
        (do
          (search-items %)
          (swap! state assoc :term-length-error false))
        (swap! state assoc :term-length-error true))}]
   [render-search
    (deref (:grants search-results))
    "Avustushaut"
    render-grant
    (:grants-searching @state)]
   [render-search
    (deref (:applications search-results))
    "Hakemukset"
    render-application
    (:applications-searching @state)]])

(defn init! []
  (let [term (router/get-param (router/get-current-query) :search)
        order (router/get-param (router/get-current-query) :order)]
    (when (seq term) (search-items {:search term :order order}))))
