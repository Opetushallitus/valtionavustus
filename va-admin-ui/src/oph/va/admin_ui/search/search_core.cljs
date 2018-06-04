(ns oph.va.admin-ui.search.search-core
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require
   [reagent.core :as r]
   [oph.va.admin-ui.components.ui :as va-ui]
   [oph.va.admin-ui.theme :as theme]
   [oph.va.admin-ui.payments.utils :refer [to-simple-date-time]]
   [oph.va.admin-ui.connection :as connection]
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

(defn- shrink [s]
  (if (> (count s) (- max-str-len 3))
    (str (subs s 0 max-str-len) "...")
    s))

(defn- search-items [term]
  (swap! state assoc :grants-searching true :applications-searching true)
  (go
    (let [result (<! (connection/find-grants term))]
      (if (:success result)
        (reset! (:grants search-results) (:body result))
        (dialogs/show-error-message!
          "Virhe hakujen etsimisessä"
          (select-keys result [:status :error-text])))
      (swap! state assoc :grants-searching false)))
  (go
    (let [result (<! (connection/find-applications term))]
      (if (:success result)
        (reset! (:applications search-results) (:body result))
        (dialogs/show-error-message!
          "Virhe hakemusten etsimisessä"
          (select-keys result [:status :error-text])))
      (swap! state assoc :applications-searching false))))

(defn- render-result-item [i link title & content]
  [:div {:key i}
   [:h3
    [:a {:href link}
     [:span {:class "search-result-title"}
      (shrink title)]]]
   (apply vector :div content)])

(defn- format-title [grant]
  (str (when (not (empty? (:register-number grant)))
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

(defn- render-application [i application]
  (render-result-item
    i
    (str "/avustushaku/"
         (:grant-id application) "/hakemus/" (:id application) "/")
    (str (get application :register-number)
         " - "
         (:organization-name application))
    (when (not (empty? (:project-name application)))
      [:div [:label {:style {:font-weight "bold" :padding-right 5}} "Hanke:"]
       (:project-name application)])
    [:div
     [:label {:style {:font-weight "bold" :padding-right 5}} "Avustushaku:"]
     (:grant-name application)]))

(defn- render-search [results title renderer searching?]
  [:div
   [:h2 title]
   (if searching?
     [ui/circular-progress]
     (if (> (count results) 0)
       (doall (map-indexed renderer results))
       [:span "Ei hakutuloksia"]))])

(defn home-page []
  [:div
   [(let [search-term (r/atom "")]
      (fn []
        [:div
         [va-ui/text-field
          {:help-text "Hakusanan pituus tulee olla yli kolme merkkiä"
           :error (:term-length-error @state)
           :on-change #(reset! search-term (-> % .-target .-value))
           :on-enter-pressed #(if (> (count @search-term) 3)
                                (do
                                  (search-items @search-term)
                                  (swap! state assoc :term-length-error false))
                                (swap! state assoc :term-length-error true))
           :style (assoc theme/text-field :width 575)}]]))]
   [(fn []
      (render-search
        (deref (:grants search-results))
        "Avustushaut"
        render-grant
        (:grants-searching @state)))]
   [(fn []
      (render-search
        (deref (:applications search-results))
        "Hakemukset"
        render-application
        (:applications-searching @state)))]])

(defn init! [])
