(ns oph.va.virkailija.kayttosuunnitelma
  (:require [clojure.string :as str]
            [clostache.parser :refer [render]]
            [oph.common.email :as email]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.budget :as va-budget]))


(defn format-number [number]
  (let [s (str number)
        grouped  (clojure.string/replace s #"(\d)(?=(\d{3})+(?!\d))" "$1\u00A0")]
    (str grouped  "\u00A0€")
    )
  )
(defn amount-cell [children]
  (str "<th class='amount budgetAmount'>" (format-number children)  "</th>"))

(defn budget-row [language use-detailed-costs item]
  (let [original-item (-> (:original item) format-number)
        overridden-item (if use-detailed-costs (-> (:overridden item) format-number))
        rows
        (str "<tr>"
             "<td>"(-> item :label language) "</td>"
             "<td class='amount budgetAmount'>" original-item "</td>"
             "<td class='amount budgetAmount'>" overridden-item "</td>"
             "</tr>")
        ]
    rows
    )
  )

(defn tbody [table language use-detailed-costs]
  (let [children (:children table)
        rows (mapv (partial budget-row language use-detailed-costs)  children)
        rows-s (str/join " " rows)
        ]
    (str "<tbody>" rows-s "</tbody>")))

(defn find-table [children index answers overridden-answers]
  (let [table (nth children index {})
        map-children (fn [x] (assoc x :original (va-budget/read-amount x answers) :overridden (va-budget/read-amount x overridden-answers)))
        new-children (map map-children (:children table))
        new-table (assoc table :children new-children)
        ]
    new-table))


(defn kayttosuunnitelma [avustushaku hakemus form-content answers translate language]
  (let [template (email/load-template "templates/kayttosuunnitelma.html")
        overridden-answers (-> hakemus :arvio  :overridden-answers)
        arvio (:arvio hakemus)
        use-detailed-costs (:useDetailedCosts arvio)
        budget-elements (->> form-content formutil/flatten-elements (filter va-budget/is-budget-field?))
        children (:children (first budget-elements))
        has-kayttosuunnitelma (not= nil children)
        table-menot (find-table children 0 answers overridden-answers)
        tbody-menot (tbody table-menot language use-detailed-costs)
        table-tulot (find-table children 1 answers overridden-answers)
        table-tulot-label (-> table-tulot :label language)
        tbody-tulot (tbody table-tulot language true)
        table-muu (find-table children 2 answers overridden-answers)
        table-muu-label (-> table-muu :label language)
        tbody-muu (tbody table-muu language true)
        cost-granted (:costsGranted arvio)
        self-financing-percentage (-> avustushaku :content :self-financing-percentage)
        oph-financing-percentage (- 100 self-financing-percentage)
        total-granted (:budget-granted arvio)
        sum-by-field (fn [table field] (reduce + (map field (:children table))))
        total-original-costs (sum-by-field table-menot :original)
        total-overridden-costs (if use-detailed-costs
                                 (sum-by-field table-menot :overridden)
                                 cost-granted)
        total-incomes (sum-by-field table-tulot :original)
        total-financing (sum-by-field table-muu :original)
        netto-total-haettu (- total-original-costs total-incomes)
        netto-total-myonnetty (- total-overridden-costs total-incomes)
        total+original (- total-original-costs total-incomes total-financing)
        total+overridden (- total-overridden-costs total-incomes total-financing)
        total-avustus  (-> total+original
                        (* oph-financing-percentage)
                        (/ 100)
                        Math/floor
                        int)
        total-haettu-omarahoitus  (-> total+original
                           (* (- 100 oph-financing-percentage))
                           (/ 100)
                           Math/ceil
                           int)

        total-myonnetty-omarahoitus (-> total+overridden
                                        (* (- 100 oph-financing-percentage))
                                        (/ 100)
                                        Math/ceil
                                        int)

        oph-full-finance (= 100 oph-financing-percentage)
        oph-financing-note (if oph-full-finance "" (str oph-financing-percentage "%"))
        hakija-financing-note (if oph-full-finance "" (str self-financing-percentage "%"))
        show-financing-note (not= self-financing-percentage 0)
        params {:t                      translate
                :total-original-costs   (amount-cell total-original-costs)
                :total-overridden-costs (amount-cell total-overridden-costs)
                :total-incomes          (amount-cell total-incomes)
                :netto-total-haettu     (amount-cell netto-total-haettu)
                :netto-total-myonnetty  (amount-cell netto-total-myonnetty)
                :total-financing        (amount-cell total-financing)
                :oph-financing-note     oph-financing-note
                :hakija-financing-note  hakija-financing-note
                :show-financing-note    show-financing-note
                :total-granted          (amount-cell total-granted)
                :total-avustus          (amount-cell total-avustus)
                :total-haettu-omarahoitus      (amount-cell total-haettu-omarahoitus)
                :total-myonnetty-omarahoitus      (amount-cell total-myonnetty-omarahoitus)
                :tbody-menot tbody-menot
                :tbody-tulot tbody-tulot
                :table-tulot-label table-tulot-label
                :tbody-muu tbody-muu
                :table-muu-label table-muu-label
                }
        body (render template params)
        ]
    {
     :body body
     :nettomenot-yhteensa (- total-overridden-costs total-incomes)
     :has-kayttosuunnitelma has-kayttosuunnitelma
     }
    )
  )