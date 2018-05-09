(ns oph.va.admin-ui.payments.payments-ui
  (:require [reagent.core :as r]
            [cljsjs.material-ui]
            [cljs-react-material-ui.reagent :as ui]
            [cljs-react-material-ui.icons :as ic]
            [oph.va.admin-ui.components.table :as table]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.payments.applications :refer [state-to-str]]
            [oph.va.admin-ui.payments.utils
             :refer [to-simple-date-time to-simple-date]]
            [oph.va.admin-ui.utils :refer [format get-answer-value]]))

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
                                        0 (filter #(> (:state %) 1)
                                                  payments)))))
    applications))

(defn render-payment [i payment]
  [table/table-row {:key i}
   [table/table-row-column {:style {:text-align "right"}}
    (get payment :register-number)]
   [table/table-row-column {:title (:organization-name payment)}
    (:organization-name payment)]
   [table/table-row-column
    [:a
     {:target "_blank"
      :title (:project-name payment)
      :href (format "/avustushaku/%d/hakemus/%d/arviointi/"
                    (:grant-id payment)
                    (:id payment))} (:project-name payment)]]
   [table/table-row-column
    {:style (merge theme/table-cell {:text-align "right"})}
    (.toLocaleString (get payment :budget-granted 0)) " €"]
   [table/table-row-column
    (get-answer-value (:answers payment) "bank-iban")]
   [table/table-row-column (get payment :lkp-account)]
   [table/table-row-column (get payment :takp-account)]
   [table/table-row-column {:style {:text-align "right"}}
    (.toLocaleString (get payment :total-paid 0)) " €"]])

(defn payments-table [payments]
  [:div
   [table/table
    [table/table-header
     [table/table-row
      [table/table-header-column {:style {:text-align "right"}} "Pitkäviite"]
      [table/table-header-column "Toimittajan nimi"]
      [table/table-header-column "Hanke"]
      [table/table-header-column {:style {:text-align "right"}} "Maksuun"]
      [table/table-header-column "Pankkitilin IBAN"]
      [table/table-header-column "LKP-tili"]
      [table/table-header-column "TaKp-tili"]
      [table/table-header-column {:style {:text-align "right"}} "Tiliöinti"]]]
    [table/table-body
     (doall (map-indexed render-payment payments))]
    [table/table-footer
     [table/table-row
      [table/table-row-column]
      [table/table-row-column]
      [table/table-row-column "Yhteensä"]
      [table/table-row-column {:style {:text-align "right"}}
       (.toLocaleString (reduce #(+ %1 (:budget-granted %2)) 0 payments))
       " €"]
      [table/table-row-column]
      [table/table-row-column]
      [table/table-row-column]
      [table/table-row-column]]]]])
