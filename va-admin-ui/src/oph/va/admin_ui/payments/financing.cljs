(ns oph.va.admin-ui.payments.financing
  (:require [reagent.core :as r]
            [oph.va.admin-ui.components.ui :as va-ui]
            [oph.va.admin-ui.payments.utils
             :refer [not-empty? valid-email? phase-to-name]]))

(def ^:private week-in-ms (* 1000 60 60 24 7))

(def ^:private transaction-accounts ["5000" "5220" "5230" "5240" "5250"])

(def ^:private document-id-max-size 12)

(defn now-plus
  [milliseconds]
  (-> (.now js/Date)
      (+ milliseconds)
      (js/Date.)))

(defn payment-batch-fields [{:keys [values on-change]}]
  [:div
   [:div {:style {:display "flex"}}
    [va-ui/date-picker
     {:floating-label-text "Laskun päivämäärä"
      :value (:invoice-date values)
      :tooltip "Laskun päivämäärä on päivämäärä, jolloin lasku lähtee
                asiakkaalle. Valtionavustusjärjestelmässä päivämäärä on se
                päivämäärä, jolloin maksu lähtee hyväksyttynä eteenpäin
                valmistelijalta. "
      :on-change #(on-change :invoice-date %2)}]
    [va-ui/date-picker
     {:floating-label-text "Eräpäivä"
      :value (:due-date values)
      :tooltip
      "Eräpäivä on se päivä, jolloin maksusuoritus on viimeistään tehtävä."
      :on-change #(on-change :due-date %2)}]
    [va-ui/date-picker
     {:floating-label-text "Tositepäivämäärä"
      :style {:display "inline-block"}
      :value (:receipt-date values)
      :tooltip "Tositepäivämäärä määrittää sen, mille kirjanpidon kaudelle
                kyseinen lasku/maksu kirjautuu. Vuoden aikana tositepäivämäärä
                voi olla sama kuin laskun päivämäärä, mutta
                tilinpäätöstilanteessa tositepäivämäärä on määriteltävä sille
                kaudelle, jolle lasku kuuluu."
      :on-change #(on-change :receipt-date %2)}]]])

(defn- valid-document? [document]
  (and
    (not-empty? (:document-id document))
    (valid-email? (:acceptor-email document))
    (valid-email? (:presenter-email document))))

(def default-document {:document-id ""
                       :phase 0
                       :presenter-email ""
                       :acceptor-email ""})

(defn document-field [props]
  (let [value (r/atom default-document)]
    (fn [props]
      [:div
       [va-ui/select-field
        {:label "Vaihe"
         :value (:phase @value)
         :values (map #(hash-map
                         :key % :value % :primary-text (phase-to-name %))
                      (range 0 (:max-phases props)))
         :on-change #(swap! value assoc :phase (js/parseInt %))}]
       [va-ui/text-field
        {:floating-label-text "Asiakirjan tunnus"
         :value (:document-id @value)
         :on-change (fn [e]
                      (let [document-id (-> e .-target .-value)]
                        (when (<= (count document-id) document-id-max-size)
                          (swap! value assoc :document-id document-id))))}]
       [va-ui/text-field
        {:floating-label-text "Esittelijän sähköpostiosoite"
         :value (:presenter-email @value)
         :type "email"
         :error (and (not-empty? (:presenter-email @value))
                     (not (valid-email? (:presenter-email @value))))
         :on-change
         #(swap! value assoc :presenter-email (.-value (.-target %)))}]
       [va-ui/text-field
        {:floating-label-text "Hyväksyjän sähköpostiosoite"
         :value (:acceptor-email @value)
         :type "email"
         :error (and (not-empty? (:acceptor-email @value))
                     (not (valid-email? (:acceptor-email @value))))
         :on-change
         #(swap! value assoc :acceptor-email (.-value (.-target %)))}]
       [va-ui/raised-button
        {:primary true
         :disabled (not (valid-document? @value))
         :label "Lisää asiakirja"
         :on-click #(do ((:on-change props) @value)
                        (reset! value default-document))}]])))
