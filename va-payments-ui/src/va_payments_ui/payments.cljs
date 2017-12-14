(ns va-payments-ui.payments
  (:require
   [reagent.core :as r]
   [cljsjs.material-ui]
   [cljs-react-material-ui.reagent :as ui]
   [cljs-react-material-ui.icons :as ic]))

(defn map-to-new-payment [application]
  {:application-id (:id application)
   :application-version (:version application)
   :state 0})

(defn create-payments [grant applications payment-values]
  (let [selected-values
        (select-keys
         payment-values
         [:document-type :transaction-account :currency :partner
          :inspector-email :acceptor-email])]
    (mapv #(merge (map-to-new-payment %) selected-values) applications)))

(defn map-to-payment [application]
  {:id (:payment-id application)
   :version (:payment-version application)
   :application-id (:id application)
   :application-version (:version application)})

(defn get-payment-data [applications payment-values]
  (let [selected-values
        (merge
         (select-keys
          payment-values
          [:installment-number :organisation :document-type :invoice-date
           :due-date :receipt-date :transaction-account :currency :partner
           :inspector-email :acceptor-email])
         {:state (:payment-state payment-values)})]
    (mapv #(merge (map-to-payment %) selected-values) applications)))

