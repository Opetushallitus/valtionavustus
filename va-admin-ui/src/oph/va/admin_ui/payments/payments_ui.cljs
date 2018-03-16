(ns oph.va.admin-ui.payments.payments-ui
  (:require [reagent.core :as r]
            [cljsjs.material-ui]
            [cljs-react-material-ui.reagent :as ui]
            [oph.va.admin-ui.payments.applications :refer [state-to-str]]
            [oph.va.admin-ui.payments.utils :refer [to-simple-date-time to-simple-date]]))

(defn render-history-item [i application]
  [ui/table-row {:key i}
   [ui/table-row-column (to-simple-date-time (:created-at application))]
   [ui/table-row-column (:version application)]
   [ui/table-row-column (state-to-str (:state application))]
   [ui/table-row-column (to-simple-date (:invoice-date application))]
   [ui/table-row-column (to-simple-date (:due-date application))]
   [ui/table-row-column (to-simple-date (:receipt-date application))]
   [ui/table-row-column (:transaction-account application)]
   [ui/table-row-column (:document-type application)]
   [ui/table-row-column (:inspector-email application)]
   [ui/table-row-column (:acceptor-email application)]
   [ui/table-row-column
    (when (:deleted application)
      (to-simple-date-time (:deleted application)))]
   [ui/table-row-column (:user-name application)]])

(defn render-history [payments]
  [ui/table {:fixed-header true :selectable false :height "300px"}
   [ui/table-header {:adjust-for-checkbox false :display-select-all false}
    [ui/table-row [ui/table-header-column "Aika"]
     [ui/table-header-column "Versio"]
     [ui/table-header-column "Tila"]
     [ui/table-header-column "Laskun päivä"]
     [ui/table-header-column "Eräpäivä"]
     [ui/table-header-column "Tositepäivä"]
     [ui/table-header-column "Maksuliikemenotili"]
     [ui/table-header-column "Tositelaji"]
     [ui/table-header-column "Tarkastaja"]
     [ui/table-header-column "Hyväksyjä"]
     [ui/table-header-column "Poistettu"]
     [ui/table-header-column "Käyttäjä"]]]
   [ui/table-body {:display-row-checkbox false}
    (doall (map-indexed render-history-item payments))]])

(defn find-application-payments [payments application-id application-version]
  (filter #(and (= (:application-version %) application-version)
                (= (:application-id %) application-id))
          payments))

(defn combine [applications payments]
  (mapv
    (fn [a]
      (let [payments (find-application-payments payments (:id a) (:version a))]
             (assoc a
                    :payments payments
                    :total-paid (reduce #(+ %1 (:payment-sum %2))
                                        0 payments))))
    applications))
