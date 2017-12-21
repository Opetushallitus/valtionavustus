(ns va-payments-ui.financing
  (:require
   [reagent.core :as r]
   [cljsjs.material-ui]
   [cljs-react-material-ui.reagent :as ui]
   [va-payments-ui.payments :refer [get-payment-data]]
   [va-payments-ui.theme :refer [button-style]]
   [va-payments-ui.utils :refer [remove-nil any-nil?]]))

(def week-in-ms (* 1000 60 60 24 7))

(def transaction-accounts ["5000" "5220" "5230" "5240" "5250"])

(defn now-plus [milliseconds]
  (js/Date. (+ (.getTime (js/Date.)) milliseconds)))

(defn payment-emails [values on-change]
  [ui/grid-list {:cols 6 :cell-height "auto"}
   [ui/text-field {:floating-label-text "Tarkastajan sähköpostiosoite"
                   :value (get values :inspector-email "")
                   :on-change
                   #(on-change :inspector-email (.-value (.-target %)))}]
   [ui/text-field {:floating-label-text "Hyväksyjän sähköpostiosoite"
                   :value (get values :acceptor-email "")
                   :on-change
                   #(on-change :acceptor-email (.-value (.-target %)))}]])

(defn payment-fields [values on-change]
  [ui/grid-list {:cols 4 :cell-height "auto"}
   [ui/select-field {:floating-label-text "Maksuliikemenotili"
                     :value (get values :transaction-account)
                     :on-change #(on-change :transaction-account %3)}
    (for [acc transaction-accounts]
      [ui/menu-item {:key acc :value acc :primary-text acc}])]
   [ui/date-picker {:floating-label-text "Eräpäivä"
                    :value (:due-date values)
                    :on-change
                    #(on-change :due-date %2)}]
   [ui/date-picker {:floating-label-text "Laskun päivämäärä"
                    :value (:invoice-date values)
                    :on-change
                    #(on-change :invoice-date %2)}]
   [ui/text-field {:floating-label-text "Maksuehto"
                   :value (get values :payment-term "Z001")
                   :read-only true
                   :on-change
                   #(on-change :payment-term (.-value (.-target %)))}]
   [ui/select-field {:floating-label-text "Tositelaji"
                     :value (get values :document-type "XA")
                     :on-change
                     #(on-change :document-type %3)}
    [ui/menu-item {:value "XA" :primary-text "XA"}]
    [ui/menu-item {:value "XB" :primary-text "XB"}]]
   [ui/date-picker {:floating-label-text "Tositepäivämäärä"
                    :style {:display "inline-block"}
                    :value (:receipt-date values)
                    :on-change
                    #(on-change :receipt-date %2)}]])

