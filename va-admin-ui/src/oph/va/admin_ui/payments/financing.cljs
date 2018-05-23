(ns oph.va.admin-ui.payments.financing
  (:require [oph.va.admin-ui.components.ui :as va-ui]
            [oph.va.admin-ui.payments.utils
             :refer [not-empty? valid-email?]]))

(def week-in-ms (* 1000 60 60 24 7))

(def transaction-accounts ["5000" "5220" "5230" "5240" "5250"])

(def document-id-max-size 12)

(defn- now-plus
  [milliseconds]
  (-> (.now js/Date)
      (+ milliseconds)
      (js/Date.)))

(defn payment-emails
  [values on-change]
  [:div {:style {:display "flex"}}
   [va-ui/text-field
    {:floating-label-text "Esittelijän sähköpostiosoite"
     :value (get values :inspector-email "")
     :type "email"
     :error (and (not-empty? (:inspector-email values))
                 (not (valid-email? (:inspector-email values))))
     :on-change #(on-change :inspector-email (.-value (.-target %)))}]
   [va-ui/text-field
    {:floating-label-text "Hyväksyjän sähköpostiosoite"
     :value (get values :acceptor-email "")
     :type "email"
     :error (and (not-empty? (:acceptor-email values))
                 (not (valid-email? (:acceptor-email values))))
     :on-change #(on-change :acceptor-email (.-value (.-target %)))}]])

(defn payment-fields
  [values on-change]
  [:div
   [:div {:style {:display "flex"}}
    [va-ui/date-picker
     {:floating-label-text "Laskun päivämäärä"
      :value (:invoice-date values)
      :on-change #(on-change :invoice-date %2)}]
    [va-ui/date-picker
     {:floating-label-text "Eräpäivä"
      :value (:due-date values)
      :on-change #(on-change :due-date %2)}]
    [va-ui/select-field
     {:floating-label-text "Maksuliikemenotili"
      :value (get values :transaction-account (first transaction-accounts))
      :on-change #(on-change :transaction-account %)
      :values
      (map (fn [acc] {:key acc :value acc :primary-text acc})
           transaction-accounts)}]
    [va-ui/select-field
     {:floating-label-text "Tositelaji"
      :value (get values :document-type "XA")
      :on-change #(on-change :document-type %)
      :values [{:value "XA" :primary-text "XA"}
               {:value "XB" :primary-text "XB"}]}]
    [va-ui/date-picker
     {:floating-label-text "Tositepäivämäärä"
      :style {:display "inline-block"}
      :value (:receipt-date values)
      :tooltip "Tarkista tilinpäätösaikataulu"
      :on-change #(on-change :receipt-date %2)}]]
   [:div [va-ui/text-field
          {:floating-label-text "Asiakirjan tunnus"
           :value (get values :document-id "")
           :on-change (fn [e]
                        (let [value (-> e .-target .-value)]
                          (when (<= (count value) document-id-max-size)
                            (on-change :document-id value))))}]]])
