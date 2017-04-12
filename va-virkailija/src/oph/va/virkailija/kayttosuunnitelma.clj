(ns oph.va.virkailija.kayttosuunnitelma
  (:require [clojure.string :as str]
            [clostache.parser :refer [render]]
            [oph.common.email :as email]
            [oph.va.budget :as va-budget])
  (:import [java.math RoundingMode]))

(defn round-decimal
  ([number scale]
   (round-decimal number scale RoundingMode/HALF_UP))
  ([number scale rounding-mode]
   (-> number
       double
       bigdec
       (.setScale scale rounding-mode)
       .doubleValue)))

(defn format-decimal [decimal]
  (-> decimal
      (str/replace-first #"\.0+$" "")
      (str/replace-first #"\." ",")))

(defn format-number [number]
  (let [s (str number)
        grouped  (clojure.string/replace s #"(\d)(?=(\d{3})+(?!\d))" "$1\u00A0")]
    (str grouped  "\u00A0€")))

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
    rows))

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

(defn- sum-by-field [table field]
  (reduce + (map field (:children table))))

(defn- calculate-floating-self-financing-fraction [hakemus]
  (let [hakemus-oph-share (:budget-oph-share hakemus)
        hakemus-total (:budget-total hakemus)]
    (/ (- hakemus-total hakemus-oph-share) hakemus-total)))

(defn kayttosuunnitelma [avustushaku hakemus form-content answers translate language]
  (let [template (email/load-template "templates/kayttosuunnitelma.html")

        overridden-answers (-> hakemus :arvio :overridden-answers)
        arvio (:arvio hakemus)
        use-detailed-costs (:useDetailedCosts arvio)
        cost-granted (:costsGranted arvio)
        budget-children (-> form-content
                          va-budget/find-budget-fields
                          first
                          :children)
        summing-fields (va-budget/find-summing-fields budget-children)
        uses-floating-self-financing (-> budget-children
                                         va-budget/find-self-financing-field
                                         :id
                                         some?)
        self-financing-percentage (if uses-floating-self-financing
                                    (-> hakemus
                                        calculate-floating-self-financing-fraction
                                        (* 100)
                                        (round-decimal 1 RoundingMode/FLOOR))
                                    (-> avustushaku
                                        :content
                                        :self-financing-percentage))
        is-oph-full-finance (and (not uses-floating-self-financing) (= 0 self-financing-percentage))
        show-omarahoitus (not is-oph-full-finance)
        oph-financing-percentage (round-decimal (- 100 self-financing-percentage) 1 RoundingMode/CEILING)
        has-kayttosuunnitelma (not= nil summing-fields)

        table-menot (find-table summing-fields 0 answers overridden-answers)
        tbody-menot (tbody table-menot language use-detailed-costs)
        table-tulot (find-table summing-fields 1 answers overridden-answers)
        table-tulot-label (-> table-tulot :label language)
        tbody-tulot (tbody table-tulot language true)
        table-muu (find-table summing-fields 2 answers overridden-answers)
        table-muu-label (-> table-muu :label language)
        tbody-muu (tbody table-muu language true)

        total-original-costs (sum-by-field table-menot :original)
        total-overridden-costs (if use-detailed-costs
                                 (sum-by-field table-menot :overridden)
                                 cost-granted)

        total-incomes (sum-by-field table-tulot :original)
        total-financing (sum-by-field table-muu :original)
        netto-total-haettu (- total-original-costs total-incomes)
        netto-total-myonnetty (- total-overridden-costs total-incomes)

        total-oph-haettu (:budget-oph-share hakemus)
        total-oph-myonnetty (:budget-granted arvio)
        total-omarahoitus-haettu (- (:budget-total hakemus) total-oph-haettu)
        total-omarahoitus-myonnetty (- netto-total-myonnetty total-financing total-oph-myonnetty)

        oph-financing-note (if is-oph-full-finance "" (str (format-decimal oph-financing-percentage) "%"))
        hakija-financing-note (if is-oph-full-finance "" (str (format-decimal self-financing-percentage) "%"))

        params {:t                           translate
                :total-original-costs        (amount-cell total-original-costs)
                :total-overridden-costs      (amount-cell total-overridden-costs)
                :total-incomes               (amount-cell total-incomes)
                :netto-total-haettu          (amount-cell netto-total-haettu)
                :netto-total-myonnetty       (amount-cell netto-total-myonnetty)
                :total-financing             (amount-cell total-financing)
                :oph-financing-note          oph-financing-note
                :hakija-financing-note       hakija-financing-note
                :show-omarahoitus            show-omarahoitus
                :total-oph-haettu            (amount-cell total-oph-haettu)
                :total-oph-myonnetty         (amount-cell total-oph-myonnetty)
                :total-omarahoitus-haettu    (amount-cell total-omarahoitus-haettu)
                :total-omarahoitus-myonnetty (amount-cell total-omarahoitus-myonnetty)
                :tbody-menot                 tbody-menot
                :tbody-tulot                 tbody-tulot
                :table-tulot-label           table-tulot-label
                :tbody-muu                   tbody-muu
                :table-muu-label             table-muu-label}

        body (render template params)]
    {:body                      body
     :nettomenot-yhteensa       (- total-overridden-costs total-incomes)
     :self-financing-percentage self-financing-percentage
     :oph-financing-percentage  oph-financing-percentage
     :has-kayttosuunnitelma     has-kayttosuunnitelma}))
