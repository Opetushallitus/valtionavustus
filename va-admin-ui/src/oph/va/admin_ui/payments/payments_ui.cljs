(ns oph.va.admin-ui.payments.payments-ui
  (:require [reagent.core :as r]
            [cljsjs.material-ui]
            [oph.va.admin-ui.components.table :as table]
            [oph.va.admin-ui.theme :as theme]
            [oph.va.admin-ui.utils :refer [format]]
            [oph.va.admin-ui.payments.utils
             :refer [phase-to-name sort-column! update-filters!
                     sort-rows filter-rows to-simple-date]]
            [oph.va.admin-ui.components.ui :as va-ui]))

(defn- render-payment [i payment]
  [table/table-row {:key i}
   [table/table-row-column
    {:style (assoc theme/semi-narrow-column :text-align "right")
     :title (:pitkaviite payment)}
    (:pitkaviite payment)]
   [table/table-row-column
    {:style theme/narrow-column}
    (:paymentstatus-str payment)]
   [table/table-row-column {:title (:organization-name payment)}
    (:organization-name payment)]
   [table/table-row-column
    [:a
     {:target "_blank"
      :title (:project-name payment)
      :href (format "/avustushaku/%d/hakemus/%d/arviointi/"
                    (:grant-id payment)
                    (:application-id payment))}
     (:project-name payment)]]
   [table/table-row-column
    {:style (assoc theme/narrow-column :text-align "right")}
    (.toLocaleString (get payment :payment-sum 0)) " €"]
   [table/table-row-column
    {:style theme/semi-narrow-column}
    (:bank-iban payment)]
   [table/table-row-column
    {:style theme/narrow-column}
    (if (seq (:lkp-account payment))
      (:lkp-account payment)
      [:span {:style theme/table-row-missing-value} "LKP-tili puuttuu"])]
   [table/table-row-column
    {:style theme/narrow-column}
    (if (seq (:takp-account payment))
      (:takp-account payment)
      [:span {:style theme/table-row-missing-value} "TAKP-tili puuttuu"])]
   [table/table-row-column
    {:style (assoc theme/narrow-column :text-align "right")}
    (.toLocaleString (get payment :payment-sum 0)) " €"]])

(defn- render-payment-group [i [phase payments] filters]
  (let [filtered-payments (filter-rows payments filters)]
    [:div {:key i :style {:padding-bottom 10}}
     [:label (phase-to-name phase)]
     [table/table-body
      {:table-element-data-test-id "sent-payment-batches-table"
       :style {:border-top "1px solid #f6f4f0"
               :border-bottom "1px solid #f6f4f0"
               :padding-right (when (< (count payments) 14) 14)}}
      (doall (map-indexed render-payment filtered-payments))]
     [table/table-footer
      [table/table-row
       [table/table-row-column
        {:style (merge theme/narrow-column theme/total-column)}
        (str (count filtered-payments) "/" (count payments) " maksatusta")]
       [table/table-row-column]
       [table/table-row-column
        {:style {:text-align "right"}}
        "Yhteensä"]
       [table/table-row-column
        {:style (assoc theme/narrow-column :text-align "right")}
        (.toLocaleString
          (reduce #(+ %1 (:payment-sum %2)) 0 filtered-payments))
        " €"]
       [table/table-row-column
        {:style theme/semi-narrow-column}]
       [table/table-row-column
        {:style theme/narrow-column}]
       [table/table-row-column
        {:style theme/narrow-column}]
       [table/table-row-column
        {:style (assoc theme/narrow-column :text-align "right")}
        (.toLocaleString
          (reduce #(+ %1 (get %2 :payment-sum 0)) 0 filtered-payments))
        " €"]]]]))

(defn payments-table [payments]
  (let [sort-params (r/atom {:sort-key nil :descend? false})
        filters (r/atom {})]
    (fn [payments]
      (let [sorted-filtered-payments
            (cond-> payments
              (some? (:sort-key @sort-params))
              (sort-rows
                (:sort-key @sort-params) (:descend? @sort-params)))
            grouped-payments (group-by :phase sorted-filtered-payments)]
        [:div
         [table/table
          {:data-test-id "payments-table"}
          [table/table-header
           [table/table-row
            [table/sortable-header-column
             {:title "Pitkäviite"
              :column-key :pitkaviite
              :sort-params @sort-params
              :style theme/semi-narrow-column
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Tila"
              :column-key :paymentstatus-str
              :sort-params @sort-params
              :style theme/narrow-column
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Toimittajan nimi"
              :column-key :organization-name
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Hanke"
              :column-key :project-name
              :sort-params @sort-params
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Maksuun"
              :column-key :payment-sum
              :sort-params @sort-params
              :style theme/narrow-column
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Pankkitilin IBAN"
              :column-key :bank-iban
              :sort-params @sort-params
              :style theme/semi-narrow-column
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "LKP-tili"
              :column-key :lkp-account
              :sort-params @sort-params
              :style theme/narrow-column
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "TaKp-tili"
              :column-key :takp-account
              :sort-params @sort-params
              :style theme/narrow-column
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]
            [table/sortable-header-column
             {:title "Tiliöinti"
              :column-key :payment-sum
              :sort-params @sort-params
              :style theme/narrow-column
              :on-sort #(sort-column! sort-params %)
              :on-filter #(update-filters! filters %1 %2)}]]]
          [:div
           (if (empty? sorted-filtered-payments)
             [:div {:style theme/table-empty-text} "Ei maksatuksia"]
             (doall (map-indexed
                      #(render-payment-group %1 %2 @filters)
                      grouped-payments)))]]]))))

(defn- render-document [{index :index
                         document :document
                         batch :batch
                         payments :payments}]
  [table/table-row {:key index}
   [table/table-row-column
    (phase-to-name (:phase document))]
   [table/table-row-column
    (.toLocaleString
      (reduce #(+ %1 (:payment-sum %2)) 0 payments))
    " €"]
   [table/table-row-column
    (count payments)]
   [table/table-row-column
    (to-simple-date (:invoice-date batch))]
   [table/table-row-column
    (to-simple-date (:due-date batch))]
   [table/table-row-column
    (to-simple-date (:receipt-date batch))]
   [table/table-row-column
    (:document-id document)]
   [table/table-row-column
    (:presenter-email document)]
   [table/table-row-column
    (:acceptor-email document)]])

(defn render-batch [index batch payments]
  [table/table-body {:key index}
   (doall
     (map-indexed
       (fn [i doc]
         (render-document
           {:index i
            :document doc
            :batch batch
            :payments (filter #(= (:phase %) (:phase doc)) payments)}))
       (:documents batch)))])

(defn batches-table [{batches :batches
                      payments :payments}]
  [table/table
   {:data-test-id "batches-table"}
   [table/table-header
    [table/table-row
     [table/table-header-column
      "Vaihe"]
     [table/table-header-column
      "Yhteensä"]
     [table/table-header-column
      "Maksatuksia"]
     [table/table-header-column
      "Laskupvm"]
     [table/table-header-column
      "Eräpvm"]
     [table/table-header-column
      "Tositepäivä"]
     [table/table-header-column
      "Allekirjoitettu yhteenveto"]
     [table/table-header-column
      "Esittelijän sähköpostiosoite"]
     [table/table-header-column
      "Hyväksyjän sähköpostiosoite"]]]
   (if (empty? batches)
     [:div {:style theme/table-empty-text} "Ei maksueriä"]
     (doall
       (map-indexed
         (fn [i batch]
           (render-batch
             i batch
             (filter #(= (:batch-id %) (:id batch)) payments)))
         batches)))])
