(ns oph.va.virkailija.export
  (:require [clj-time.format :as clj-time-format]
            [clojure.set :as clj-set]
            [clojure.string :as str]
            [clojure.string :as string]
            [clojure.tools.logging :as log]
            [oph.soresu.common.db :refer [query]]
            [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.soresu.form.formhandler :as formhandler]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.virkailija.utils :refer [remove-white-spaces]])
  (:import (java.io ByteArrayOutputStream)
           (org.apache.poi.ss.usermodel Cell CellStyle CellType Sheet Workbook)))

(def unsafe-cell-string-value-prefixes "=-+@")

(def column-default-width-in-chars 30)

(def cell-value-no-fit-threshold-in-chars 40)

(def common-field-labels
  (array-map :register-number   "Asianumero"
             :organization-name "Hakijaorganisaatio"
             :project-name      "Hankkeen nimi"
             :language          "Asiointikieli"))

(def main-sheet-name "Hakemukset")

(def main-sheet-columns
  (into (vec (vals common-field-labels))
        '("Ehdotettu budjetti"
          "OPH:n avustuksen osuus"
          "Myönnetty avustus"
          "Arviokeskiarvo")))

(def hakemus->main-sheet-rows
  (apply juxt (into (vec (keys common-field-labels))
                    [:budget-total
                     :budget-oph-share
                     (comp :budget-granted :arvio)
                     (comp :score-total-average :scoring :arvio)])))

(def hakemus-all-answers-sheet-name "Hakemuksien vastaukset")

(def hakemus-all-answers-sheet-fixed-fields
  [["fixed-register-number" (:register-number common-field-labels) :register-number {:fieldType "textField"}]
   ["fixed-organization-name" (:organization-name common-field-labels) :organization-name {:fieldType "textField"}]
   ["fixed-project-name" (:project-name common-field-labels) :project-name {:fieldType "textField"}]
   ["fixed-language" (:language common-field-labels) :language {:fieldType "textField"}]
   ["fixed-budget-total" "Ehdotettu budjetti" :budget-total {:fieldType "numberField"}]
   ["fixed-budget-oph-share" "OPH:n avustuksen osuus" :budget-oph-share {:fieldType "numberField"}]
   ["fixed-budget-granted" "Myönnetty avustus" (comp :budget-granted :arvio) {:fieldType "numberField"}]
   ["fixed-score-total-average" "Arviokeskiarvo" (comp :score-total-average :scoring :arvio) {:fieldType "numberField"}]])

(def hakemus-table-answers-sheet-name "Hakemuksien taulukot")
(def väliselvitys-table-answers-sheet-name "Väliselvityksien taulukot")
(def loppuselvitys-table-answers-sheet-name "Loppuselvityksien taulukot")
(def väliselvitys-all-answers-sheet-name "Väliselvityksien vastaukset")
(def loppuselvitys-all-answers-sheet-name "Loppuselvityksien vastaukset")

(def väliselvitys-all-answers-sheet-fixed-fields
  [["fixed-register-number" (:register-number common-field-labels) :register-number {:fieldType "textField"}]
   ["fixed-organization-name" (:organization-name common-field-labels) :organization-name {:fieldType "textField"}]
   ["fixed-project-name" (:project-name common-field-labels) :project-name {:fieldType "textField"}]
   ["fixed-language" (:language common-field-labels) :language {:fieldType "textField"}]
   ["fixed-budget-total" "Toteutunut budjetti" :budget-total {:fieldType "numberField"}]
   ["fixed-budget-oph-share" "OPH:n avustuksen osuus" :budget-oph-share {:fieldType "numberField"}]])

(def loppuselvitys-all-answers-sheet-fixed-fields
  [["fixed-register-number" (:register-number common-field-labels) :register-number {:fieldType "textField"}]
   ["fixed-organization-name" (:organization-name common-field-labels) :organization-name {:fieldType "textField"}]
   ["fixed-project-name" (:project-name common-field-labels) :project-name {:fieldType "textField"}]
   ["fixed-language" (:language common-field-labels) :language {:fieldType "textField"}]
   ["fixed-budget-total" "Toteutunut budjetti" :budget-total {:fieldType "numberField"}]
   ["fixed-budget-oph-share" "OPH:n avustuksen osuus" :budget-oph-share {:fieldType "numberField"}]])

(def maksu-sheet-name "Tiliöinti")

(def maksu-sheet-columns
  ["Maksuerä"
   "Toimittaja-numero"
   "Toimittajan nimi"
   "Pankkitili"
   "Maksuliike-menotili"
   "Eräpvm"
   "EUR"
   "Val"
   "Maksu ehto"
   "Pitkä viite"
   "Laskun päivämäärä"
   "Tositelaji"
   "Tosite-päivä"
   "LKP-TILI"
   "ALV-koodi"
   "Tiliöinti-summa"
   "Toiminta-yksikkö"
   "TaKp-tili"
   "Valtuus-numero"
   "Projekti"
   "Suorite"
   "Alue / Kunta"
   "Kumppani"
   "Seuranta kohde 1"
   "Seuranta kohde 2"
   "Varalla 1"
   "Varalla 1"
   "KOM-yksikkö"
   "Selite (Tiliöinti)"
   "Asiatarkastajan sähköpostiosoite"
   "Hyväksyjän sähköpostiosoite"])

(def hakemus->maksu-sheet-rows
  (juxt :era
        (constantly "")
        :organization-name
        :iban
        (constantly "FI1950000121501406")
        (constantly "")
        :payment
        (constantly "EUR")
        (constantly "Z001")
        :register-number
        :paatos-date
        (constantly "XE")
        :paatos-date
        :lkp
        (constantly "")
        :payment
        (constantly "")
        :takp
        (constantly "")
        (constantly "")
        (constantly "")
        (constantly "")
        (constantly "")
        (constantly "")
        (constantly "")
        (constantly "")
        (constantly "")
        (constantly "")
        (constantly "")
        (constantly "")
        (constantly "")))

(defn- third [list] (nth list 2))

(defn- fourth [list] (nth list 3))

(defn- has-child? [id node]
  (when-let [children (:children node)]
    (let [child-list (->> children
                          (filter (fn [child] (= (:id child) id))))]
      (when (not (empty? child-list))
        node))))

(defn- find-parent [wrappers id]
  (->> wrappers
       (filter (partial has-child? id))
       first))

(defn- field->type [field]
  (select-keys field [:fieldType :options :params]))

(defn- field->label [field parent suffix va-focus-areas-label]
  (if (= (:fieldType field) "vaFocusAreas")
    va-focus-areas-label
    (str (or (-> field :label :fi)
             (-> parent :label :fi)) suffix)))

(defn- mark-and-reject-growing-fields [wrappers va-focus-areas-label data field]
  (let [parent (find-parent wrappers (:id field))
        grandparent (find-parent wrappers (:id parent))
        add-reject (fn [data]
                     (assoc data :rejects (conj (:rejects data) (:id grandparent))))
        add-value (fn [data value]
                    (assoc data :values (conj (:values data) value)))]
    (if (= "growingFieldset" (:fieldType grandparent))
      ;; Special case: handle growing field sets by placing marker
      (let [reject? (contains? (-> data :rejects) (:id grandparent))
            data (add-reject data)]
        (if reject?
          data
          (add-value data {:growingField (:id grandparent)})))

      ;; Normal case - add value to data
      (add-value data [(:id field)
                       (field->label field parent "" va-focus-areas-label)
                       (field->type field)]))))

(defn- process-growing-field [fields wrappers va-focus-areas-label id]
  (let [seq-number (last (re-find #"([0-9]+)[^0-9]*$" id))
        mangled-id (string/replace id #"[0-9]+([^0-9]*)$" "1$1")
        field (->> fields
                   (filter (fn [f] (= (:id f) mangled-id)))
                   first)
        parent (find-parent wrappers field)]
    [id
     (field->label field parent (str " " seq-number) va-focus-areas-label)
     (field->type field)]))

(defn- inject-growing-fieldsets [fields wrappers va-focus-areas-label growing-fieldset-lut triples]
  (if (map? triples)
    (let [fieldset-id (:growingField triples)
          fieldset-lut (get growing-fieldset-lut fieldset-id)]
      (->> (keys fieldset-lut)
           (reduce (fn [acc entry]
                     (apply conj acc (mapv (partial process-growing-field
                                                    fields
                                                    wrappers
                                                    va-focus-areas-label)
                                           (get fieldset-lut entry))))
                   [])))
    triples))

(defn- unwrap-double-nested-lists [list item]
  (if (vector? (first item))
    (apply conj list item)
    (conj list item)))

(defn- avustushaku->formlabels [form va-focus-areas-label growing-fieldset-lut]
  (let [rich-form (->> form
                       (formhandler/add-koodisto-values)
                       :content)
        fields    (formutil/find-fields rich-form)
        wrappers  (formutil/find-wrapper-elements rich-form)]
    (->> rich-form
         (formutil/find-fields)
         (reduce (partial mark-and-reject-growing-fields wrappers va-focus-areas-label) {:rejects #{} :values []})
         :values
         (map (partial inject-growing-fieldsets fields wrappers va-focus-areas-label growing-fieldset-lut))
         (reduce unwrap-double-nested-lists [])
         (filter (comp not empty?)))))

(defn- hakemus->answers-sheet-map [fixed-fields hakemus]
  (let [answers (formutil/unwrap-answers (:answers hakemus) ["checkboxButton" "vaFocusAreas" "tableField"])]
    (reduce (fn [answer-map [field-name _ lookup-fn]]
              (assoc answer-map field-name (lookup-fn hakemus)))
            answers
            fixed-fields)))

(defn- comma-to-dot [str]
  (string/replace str "," "."))

(defn- remove-dots [str]
  (string/replace str "." ""))

(defn- str->float [str]
  (when (not (empty? str))
    (Float/parseFloat (comma-to-dot (remove-white-spaces str)))))

(defn- str->int [str]
  (when (not (empty? str))
    (try
      (Integer/parseInt (remove-white-spaces str))
      (catch NumberFormatException e
        (log/warn "Invalid value in moneyField:" str)
        nil))))

(defn- answer->str [answer-set va-focus-areas-items id answer-type]
  (case (:fieldType answer-type)
    "radioButton" (let [value (get answer-set id)]
                    (or (->> answer-type
                             :options
                             (filter (fn [val] (= (:value val) value)))
                             first
                             :label
                             :fi)
                        value))
    "dropdown" (let [value (get answer-set id)]
                 (or (->> answer-type
                          :options
                          (filter (fn [val] (= (:value val) value)))
                          first
                          :label
                          :fi)
                     value))
    "checkboxButton" (let [value (get answer-set id)
                           options (:options answer-type)]
                       (->> options
                            (filter (fn [val] (formutil/in? value (:value val))))
                            (map (fn [val] (->> val :label :fi)))
                            (string/join "; ")))
    "vaFocusAreas" (->> (get answer-set id)
                        (map (fn [val] (->> val
                                            (re-find #".*([0-9]+)$")
                                            last
                                            (Long/parseLong))))
                        (map (fn [index] (->> (nth va-focus-areas-items index)
                                              :fi)))
                        (string/join "; "))
    "tableField" (->> (get answer-set id)
                      (map (partial string/join " | "))
                      (string/join "\n"))
    "moneyField" (str->int (get answer-set id))
    "vaTraineeDayCalculator" (str->float (get answer-set (str id ".total")))
    (get answer-set id)))

(defn- answers->strs [answer-keys answer-types va-focus-areas-items answer-set]
  (mapv (partial answer->str answer-set va-focus-areas-items)
        answer-keys
        answer-types))

(defn- generate-growing-fieldset-lut [hakemukset]
  (let [answer-list (map :answers hakemukset)
        descend-to-child (fn [acc child]
                           (conj acc [(:key child) (mapv :key (:value child))]))
        convert-answers-to-lookup-table (fn [value]
                                          (array-map (:key value) (reduce descend-to-child (array-map) (:value value))))
        growing-fieldset-answer? (fn [answer] (and (vector? (:value answer))
                                                   (= "growingFieldset" (:fieldType answer))))
        process-answers (fn [answers] (->> answers
                                           (filter growing-fieldset-answer?)
                                           (mapv convert-answers-to-lookup-table)))
        combine (fn [accumulated single-entry]
                  (reduce (fn [acc item]
                            (merge-with merge acc item))
                          accumulated
                          single-entry))]
    (->> answer-list
         (mapv process-answers)
         (reduce combine (array-map)))))

(defn- format-date [date-string]
  (try
    (let [date (clj-time-format/parse (clj-time-format/formatter "dd.MM.YYYY") date-string)
          formatted (.print (clj-time-format/formatter "ddMMyyyy") date)]
      formatted)
    (catch Exception e (if (nil? date-string) "" date-string))))

(defn- extract-table-field-specs [answer-keys answer-labels answer-types]
  (->> (map (fn [k l t] {:key k :label l :type t})
            answer-keys answer-labels answer-types)
       (filter (fn [{t :type}] (= (:fieldType t) "tableField")))))

(defn- extract-table-field-answers [field-specs answer-set]
  (mapv (fn [{key :key}] (get answer-set key))
        field-specs))

(defn- growing-table? [field-spec]
  (empty? (get-in field-spec [:type :params :rows])))

(defn- collect-table-max-rows-and-columns [field-specs answers-values]
  (let [max-columns-by-field (mapv (fn [field-spec]
                                     (+ (count (get-in field-spec [:type :params :columns]))
                                        (if (growing-table? field-spec) 0 1)))
                                   field-specs)
        max-rows-by-answers  (mapv (fn [table-values]
                                     (reduce (fn [max-rows table-value]
                                               (max max-rows (count table-value)))
                                             0
                                             table-values))
                                   answers-values)]
    {:max-rows-by-answers  max-rows-by-answers
     :max-columns-by-field max-columns-by-field}))

(defn- pad-flatten-table-values [max-row max-columns-by-field field-specs table-values]
  (let [row-pad (+ 1 max-row)]
    (reduce (fn [rows [max-column field-spec table-value]]
              (let [is-growing-table   (growing-table? field-spec)
                    num-cols-in-row    (- max-column (if is-growing-table 0 1))
                    col-pad            (+ 1 max-column)
                    num-rows           (count table-value)
                    row-labels         (vec (get-in field-spec [:type :params :rows]))
                    padded-table-value (into (vec table-value) (repeat (- row-pad num-rows) []))]
                (reduce-kv (fn [rows row-idx table-row]
                             (let [safe-table-row (vec (take num-cols-in-row table-row))
                                   padded-row     (-> (if is-growing-table
                                                        []
                                                        [(get-in row-labels [row-idx :title :fi])])
                                                      (into safe-table-row)
                                                      (into (repeat (- col-pad
                                                                       (count safe-table-row)
                                                                       (if is-growing-table 0 1))
                                                                    nil)))]
                               (update rows row-idx into padded-row)))
                           rows
                           padded-table-value)))
            (vec (repeat row-pad []))
            (map vector max-columns-by-field field-specs table-values))))

(defn- scan-table-start-column-indexes [max-columns-by-field]
  (reduce (fn [sums max-column]
            (conj sums
                  (+ max-column
                     1
                     (peek sums))))
          [0]
          max-columns-by-field))

(defn- table-field-answers->rows [field-specs answers-values]
  (let [{:keys [max-rows-by-answers
                max-columns-by-field]} (collect-table-max-rows-and-columns field-specs answers-values)]
    (let [start-column-indexes (scan-table-start-column-indexes max-columns-by-field)
          col-header-indexes   (into []
                                     (mapcat (fn [field-spec max-column start-col-idx]
                                               (range start-col-idx (+ start-col-idx max-column)))
                                             field-specs
                                             max-columns-by-field
                                             start-column-indexes))
          row-header-indexes   (->> start-column-indexes
                                    (map (fn [field-spec column-idx]
                                           (if (growing-table? field-spec)
                                             nil
                                             column-idx))
                                         field-specs)
                                    (filterv some?)
                                    set)
          field-label-row      (into []
                                     (mapcat (fn [field-spec max-column]
                                               (cons (:label field-spec) (repeat max-column nil)))
                                             field-specs
                                             max-columns-by-field))
          column-label-row     (into []
                                     (mapcat (fn [field-spec]
                                               (-> (if (growing-table? field-spec) [] [nil])
                                                   (into (mapv (fn [col-spec]
                                                                 (get-in col-spec [:title :fi]))
                                                               (get-in field-spec [:type :params :columns])))
                                                   (conj nil)))
                                             field-specs))
          data-rows            (reduce (fn [rows [max-row table-values]]
                                         (into rows (pad-flatten-table-values max-row
                                                                              max-columns-by-field
                                                                              field-specs
                                                                              table-values)))
                                       []
                                       (map vector max-rows-by-answers answers-values))]
      {:rows                  (into [field-label-row column-label-row] data-rows)
       :header-cell-coords    (into #{} (mapcat (fn [row-idx]
                                                  (map (partial vector row-idx) col-header-indexes))
                                                '(0 1)))
       :header-column-indexes row-header-indexes})))

(defn- unsafe-string-cell-value? [^String value]
  (if (.isEmpty value)
    false
    (let [value-first-char (.codePointAt value 0)]
      (>= (.indexOf unsafe-cell-string-value-prefixes value-first-char) 0))))

(defn- quote-string-cell-with-formula-like-value! [^Cell cell ^CellStyle safe-formula-style]
  (when (and (= (.getCellType cell) CellType/STRING)
             (unsafe-string-cell-value? (.getStringCellValue cell)))
    (.setCellStyle cell safe-formula-style)))

(defn- fit-cell? [^Cell cell]
  (let [value-str (-> cell spreadsheet/read-cell str)]
    (if (>= (count value-str) cell-value-no-fit-threshold-in-chars)
      (let [str-rows (string/split value-str #"\n")]
        (not-any? #(>= (count %) cell-value-no-fit-threshold-in-chars) str-rows))
      true)))

(defn adjust-cells-style! [{:keys [^Sheet sheet
                                   header-row-indexes
                                   header-column-indexes
                                   header-cell-coords]}
                           ^CellStyle header-style
                           ^CellStyle safe-formula-style]
  (.setDefaultColumnWidth sheet column-default-width-in-chars)
  (let [cols-not-to-fit (reduce-kv
                         (fn [cols-not-to-fit row-idx row]
                           (when (contains? header-row-indexes row-idx)
                             (spreadsheet/set-row-style! row header-style))

                           (reduce-kv
                            (fn [cols-not-to-fit col-idx cell]
                              (if (some? cell)
                                (do
                                  (when (or (contains? header-column-indexes col-idx)
                                            (contains? header-cell-coords [row-idx col-idx]))
                                    (.setCellStyle cell header-style))

                                  (quote-string-cell-with-formula-like-value! cell safe-formula-style)

                                  (if (fit-cell? cell)
                                    cols-not-to-fit
                                    (conj cols-not-to-fit col-idx)))
                                cols-not-to-fit))
                            cols-not-to-fit
                            (spreadsheet/into-seq row)))
                         #{}
                         (spreadsheet/into-seq sheet))
        cols-to-fit (clj-set/difference (set (range 0 (-> sheet (.getRow 0) .getLastCellNum)))
                                        cols-not-to-fit)]
    (doseq [col-idx cols-to-fit]
      (.autoSizeColumn sheet col-idx))))

(def lkp-map {:kunta_kirkko                         82010000
              :kunta-kuntayhtymae                   82010000

              :liiketalous                          82310000
              :yksityinen-yhteisoe                  82310000

              :julkisoikeudellinen-yhteisoe         82510000
              :rekisteroeity-yhteisoe-tai-saeaetioe 82510000
              :voittoa_tavoittelematon              82510000

              :ei-eu-maat                           82800000

              :eu-maat                              82820000

              :yliopisto                            82921000

              :valtio                               82980000})

(defn add-paatos-data [paatos-date hakemus]
  (let [answers (:answers hakemus)
        answers-values {:value answers}
        arvio (:arvio hakemus)
        takp (-> (:talousarviotili arvio)
                 str
                 remove-white-spaces
                 remove-dots)
        iban (formutil/find-answer-value answers-values "bank-iban")
        iban-formatted (if iban (remove-white-spaces iban) iban)
        lkp-answer (formutil/find-answer-value answers-values "radioButton-0")
        lkp (get lkp-map (keyword lkp-answer))
        formatted-paatos-date (format-date paatos-date)]
    (assoc hakemus :paatos-date formatted-paatos-date
           :iban iban-formatted
           :lkp lkp
           :takp takp)))

(defn- split-multiple-maksuera-if-needed [has-multiple-maksuera hakemus]
  (let [arvio (:arvio hakemus)
        total-paid (:budget-granted arvio)
        multiple-maksuera (and has-multiple-maksuera (> total-paid 60000))
        first-round-paid (if multiple-maksuera (Math/round (* 0.6 total-paid)) total-paid)
        second-round-paid (Math/round (* 0.4 total-paid))
        hakemus1 (assoc hakemus :era 1 :payment first-round-paid)
        hakemus2 (assoc hakemus :era 2 :payment second-round-paid)]
    (if multiple-maksuera
      [hakemus1 hakemus2]
      [hakemus1])))

(defn- make-main-sheet-rows [hakemukset]
  (apply conj
         [main-sheet-columns]
         (mapv hakemus->main-sheet-rows hakemukset)))

(defn get-normalized-hakemus [hakemus-id]
  (first
   (query
    "SELECT
         n.contact_person,
         n.contact_email,
         n.contact_phone,
         n.trusted_contact_name,
         n.trusted_contact_email,
         n.trusted_contact_phone
       FROM virkailija.normalized_hakemus n
       JOIN hakija.hakemukset  h ON h.id = n.hakemus_id
       JOIN hakija.avustushaut a ON a.id = h.avustushaku
       WHERE h.version_closed IS NULL
         AND a.muutoshakukelpoinen = true
         AND n.hakemus_id = ?"
    [hakemus-id])))

(def patch-answer-key-map
  {:contact-person        'applicant-name
   :contact-email         'primary-email
   :contact-phone         'textField-0
   :trusted-contact-name  'trusted-contact-name
   :trusted-contact-email 'trusted-contact-email
   :trusted-contact-phone 'trusted-contact-phone})

(defn patch-answer-map
  [answers db-row]
  (reduce
   (fn [row [db-k sym-k]]
     (let [v (get db-row db-k)]
       (if (or (nil? v)
               (and (string? v) (clojure.string/blank? v)))
         row
         (-> row
             (assoc (name sym-k) v)))))
   answers
   patch-answer-key-map))

(defn- make-answers-sheet-rows [form hakemukset va-focus-areas-label va-focus-areas-items fixed-fields]
  (let [growing-fieldset-lut          (generate-growing-fieldset-lut hakemukset)

        answer-key-label-type-triples (avustushaku->formlabels form
                                                               va-focus-areas-label
                                                               growing-fieldset-lut)
        answer-keys                   (apply conj
                                             (mapv first fixed-fields)
                                             (mapv first answer-key-label-type-triples))
        answer-labels                 (apply conj
                                             (mapv second fixed-fields)
                                             (mapv second answer-key-label-type-triples))
        answer-types                  (apply conj
                                             (mapv fourth fixed-fields)
                                             (mapv third answer-key-label-type-triples))
        original-answer-sets          (map (partial hakemus->answers-sheet-map fixed-fields)
                                           hakemukset)
        answer-sets (map (fn [hakemus answers]
                           (if-let [db-row (get-normalized-hakemus (:id hakemus))]
                             (patch-answer-map answers db-row)
                             answers))
                         hakemukset
                         original-answer-sets)
        all-answers-data-rows         (mapv (partial answers->strs answer-keys answer-types va-focus-areas-items)
                                            answer-sets)
        all-answers-rows              (into [answer-labels] all-answers-data-rows)

        table-field-specs             (extract-table-field-specs answer-keys answer-labels answer-types)]
    (if (empty? table-field-specs)
      {:all-answers-rows all-answers-rows}

      (let [table-field-answers
            (map (partial extract-table-field-answers table-field-specs)
                 answer-sets)

            id-table-field-spec
            {:label nil :type {:params {:columns (mapv (fn [[_ v]] {:title {:fi v}}) common-field-labels)}}}

            id-table-field-answers
            (map (fn [hakemus] [(mapv (fn [[k _]] (get hakemus k)) common-field-labels)]) hakemukset)

            {table-answers-rows          :rows
             table-header-cell-coords    :header-cell-coords
             table-header-column-indexes :header-column-indexes}
            (table-field-answers->rows (cons id-table-field-spec table-field-specs)
                                       (map (fn [r as] (into [r] as))
                                            id-table-field-answers
                                            table-field-answers))]

        {:all-answers-rows            all-answers-rows
         :table-answers-rows          table-answers-rows
         :table-header-cell-coords    table-header-cell-coords
         :table-header-column-indexes table-header-column-indexes}))))

(defn- make-maksu-sheet-rows [accepted-hakemukset paatos-date has-multiple-maksuera]
  (let [map-paatos-data                   (partial add-paatos-data paatos-date)
        map-split-multiple                (partial split-multiple-maksuera-if-needed has-multiple-maksuera)
        accepted-list-multiple-maksuera-1 (mapv map-split-multiple accepted-hakemukset)
        accepted-list-multiple-maksuera-2 (flatten accepted-list-multiple-maksuera-1)
        accepted-list-sorted              (sort-by :organization-name accepted-list-multiple-maksuera-2)
        accepted-list-paatos              (mapv map-paatos-data accepted-list-sorted)]
    (apply conj
           [maksu-sheet-columns]
           (mapv hakemus->maksu-sheet-rows accepted-list-paatos))))

(defn- make-answers-sheets [^Workbook wb
                            all-answers-sheet-name
                            table-answers-sheet-name
                            hakemus-form
                            hakemus-list
                            va-focus-areas-label
                            va-focus-areas-items
                            answers-sheet-fixed-fields]
  (let [{:keys [all-answers-rows
                table-answers-rows
                table-header-cell-coords
                table-header-column-indexes]} (make-answers-sheet-rows hakemus-form
                                                                       hakemus-list
                                                                       va-focus-areas-label
                                                                       va-focus-areas-items
                                                                       answers-sheet-fixed-fields)
        all-answers-sheet {:sheet              (doto (spreadsheet/add-sheet! wb all-answers-sheet-name)
                                                 (spreadsheet/add-rows! all-answers-rows))
                           :header-row-indexes #{0}}

        table-answers-sheet (when (seq table-answers-rows)
                              {:sheet                 (doto (spreadsheet/add-sheet! wb table-answers-sheet-name)
                                                        (spreadsheet/add-rows! table-answers-rows))
                               :header-cell-coords    table-header-cell-coords
                               :header-column-indexes table-header-column-indexes})]
    (if (some? table-answers-sheet)
      [all-answers-sheet table-answers-sheet]
      [all-answers-sheet])))

(defn export-avustushaku [avustushaku-combined]
  (let [avustushaku           (:avustushaku avustushaku-combined)
        va-focus-areas-label  (-> avustushaku :content :focus-areas :label :fi)
        va-focus-areas-items  (-> avustushaku :content :focus-areas :items)
        paatos-date           (-> avustushaku :decision :date)
        has-multiple-maksuera (-> avustushaku :content :multiplemaksuera)
        hakemus-form          (:form avustushaku-combined)
        hakemus-list          (:hakemukset avustushaku-combined)
        väliselvitys-form     (:form_väliselvitys avustushaku-combined)
        väliselvitys-list     (:väliselvitykset avustushaku-combined)
        loppuselvitys-form    (:form_loppuselvitys avustushaku-combined)
        loppuselvitys-list    (:loppuselvitykset avustushaku-combined)

        output                (ByteArrayOutputStream.)

        wb                    (spreadsheet/create-workbook main-sheet-name
                                                           (make-main-sheet-rows hakemus-list))

        main-sheet            {:sheet              (spreadsheet/select-sheet main-sheet-name wb)
                               :header-row-indexes #{0}}

        hakemus-sheets        (make-answers-sheets wb
                                                   hakemus-all-answers-sheet-name
                                                   hakemus-table-answers-sheet-name
                                                   hakemus-form
                                                   hakemus-list
                                                   va-focus-areas-label
                                                   va-focus-areas-items
                                                   hakemus-all-answers-sheet-fixed-fields)

        väliselvitys-sheets (make-answers-sheets wb
                                                 väliselvitys-all-answers-sheet-name
                                                 väliselvitys-table-answers-sheet-name
                                                 väliselvitys-form
                                                 väliselvitys-list
                                                 va-focus-areas-label
                                                 va-focus-areas-items
                                                 väliselvitys-all-answers-sheet-fixed-fields)

        loppuselvitys-sheets (make-answers-sheets wb
                                                  loppuselvitys-all-answers-sheet-name
                                                  loppuselvitys-table-answers-sheet-name
                                                  loppuselvitys-form
                                                  loppuselvitys-list
                                                  va-focus-areas-label
                                                  va-focus-areas-items
                                                  loppuselvitys-all-answers-sheet-fixed-fields)

        maksu-sheet           {:sheet (doto (spreadsheet/add-sheet! wb maksu-sheet-name)
                                        (spreadsheet/add-rows! (make-maksu-sheet-rows (filter #(= "accepted" (-> % :arvio :status)) hakemus-list)
                                                                                      paatos-date
                                                                                      has-multiple-maksuera)))
                               :header-row-indexes #{0}}

        safe-formula-style    (doto (.createCellStyle wb)
                                (.setQuotePrefixed true))

        header-style          (spreadsheet/create-cell-style! wb {:background :yellow
                                                                  :font       {:bold true}})]

    (doseq [sheet (-> [main-sheet]
                      (into hakemus-sheets)
                      (into väliselvitys-sheets)
                      (into loppuselvitys-sheets)
                      (conj maksu-sheet))]
      (adjust-cells-style! sheet header-style safe-formula-style))

    (.write wb output)
    (.toByteArray output)))

(def main-sheet-name-hallinnoiavustuksia "VA")
(def hallinnoiavustuksia-column-labels
  ["valtionapuviranomainen"
   "avustushakuAsianumero"
   "avustushakuNimi"
   "avustushakuAvustuslaji"
   "avustushakuAlkaaPvm"
   "avustushakuPaattyyPvm"
   "avustushakuURL"
   "avustusasiaAsianumero"
   "avustusasiaVireilletuloPvm"
   "avustusasiaKieli"
   "avustusasiaVireillepanijaHenkiloTunnus"
   "avustusasiaVireillepanijaHenkiloNimi"
   "avustusasiaVireillepanijaYhteisoTunnus"
   "avustusasiaVireillepanijaYhteisoNimi"
   "avustushakemusHaettuKayttotarkoitus"
   "avustushakemusHaettuAvustus"
   "avustushakemusAlueKunnat"
   "avustushakemusAlueMaakunnat"
   "avustushakemusAlueHyvinvointialueet"
   "avustushakemusAlueValtiot"
   "avustuspaatosPvm"
   "avustuspaatosPerustelu"
   "avustuspaatosTyyppi"
   "avustuspaatosMyonnettyAvustus"
   "avustuspaatosHyvaksyttyKayttotarkoitus"
   "avustuspaatosKayttoaikaAlkaaPvm"
   "avustuspaatosKayttoaikaPaattyyPvm"
   "avustuspaatosMaksettuAvustus"
   "piilotaKayttotarkoitus"
   "piilotaVireillepanija"
   "poistaTiedot"
   "euVarat"
   "saajanSektoriluokitus"
   "ulkomainenSaaja"])

(defn get-valtionapuviranomainen [data]
  (if (= (:toimintayksikko data) "6600105300") "JOTPA" "OPH"))

(defn get-kotikunta [data]
  (let [content (:content data)
        koodisto-fields (formutil/find-fields* (partial formutil/has-field-type? "koodistoField") content)
        kotikunta-koodisto-field (first (filter #(= (get-in % [:params :koodisto :uri]) "kotikunnat") koodisto-fields))
        koodisto-field-id (:id kotikunta-koodisto-field)
        koodisto-params (get-in kotikunta-koodisto-field [:params :koodisto])
        koodisto-answer-value (formutil/find-answer-value (:answers data) koodisto-field-id)]
    (formhandler/find-koodisto-value-name koodisto-answer-value koodisto-params)))

(defn get-y-tunnus [data]
  (or (formutil/find-answer-value (:answers data) "business-id") ""))

(defn get-avustuspaatos-tyyppi [data]
  (case (:paatos-status data)
    "rejected" "Kielteinen"
    "accepted" "Myönteinen"
    ""))

(defn get-nutshell [data]
  (or (formutil/find-answer-value (:answers data) "project-nutshell")
      (:kayttotarkoitus data)
      ""))

(def avustushaku->hallinoi-sheet-rows
  (juxt
   (constantly "OPH") ;(comp get-valtionapuviranomainen) ;"valtionapuviranomainen"
   :avustushaku-asianumero ;"avustushakuAsianumero"
   (constantly "") ;"avustushakuNimi"
   (constantly "") ;"avustushakuAvustuslaji"
   (constantly "") ;"avustushakuAlkaaPvm"
   (constantly "") ;"avustushakuPaattyyPvm"
   (constantly "") ;"avustushakuURL"
   :asianumero     ;"avustusasiaAsianumero"
   :vireille-tulo-pvm ;"avustusasiaVireilletuloPvm"
   :language ;"avustusasiaKieli"
   (constantly "") ;"avustusasiaVireillepanijaHenkiloTunnus"
   (constantly "") ;"avustusasiaVireillepanijaHenkiloNimi"
   (comp get-y-tunnus) ;"avustusasiaVireillepanijaYhteisoTunnus"
   (constantly "") ;"avustusasiaVireillepanijaYhteisoNimi"
   (constantly "") ;"avustushakemusHaettuKayttotarkoitus"
   :budget-total ;"avustushakemusHaettuAvustus"
   (comp get-kotikunta) ;"avustushakemusAlueKunnat"
   (constantly "") ;"avustushakemusAlueMaakunnat"
   (constantly "") ;"avustushakemusAlueHyvinvointialueet"
   (constantly "") ;"avustushakemusAlueValtiot"
   :paatos-ratkaisu-pvm ;"avustukspaatosPvm"
   (constantly "") ;"avustuspaatosPerustelu"
   (comp get-avustuspaatos-tyyppi) ;"avustuspaatosTyyppi"
   :myonnetty ;"avustuspaatosMyonnettyAvustus"
   (comp get-nutshell) ;"avustuspaatosHyvaksyttyKayttotarkoitus"
   (constantly "") ;"avustuspaatosKayttoaikaAlkaaPvm"
   (constantly "") ;"avustuspaatosKayttoaikaPaattyyPvm"
   (constantly "") ;"avustuspaatosMaksettuAvustus"
   (constantly "") ;"piilotaKayttotarkoitus"
   (constantly "") ;"piilotaVireillepanija"
   (constantly "") ;"poistaTiedot"
   (constantly "") ;"euVarat"
   (constantly "") ;"saajanSektoriluokitus"
   (constantly "Ei") ;"ulkomainenSaaja"
   ))

(defn export-avustushaku-for-hallinnoiavustuksia [avustushaku-id]
  (let [data (query "
                      WITH hakemus_submitted AS (
                        SELECT
                          id,
                          min(created_at) as first_time_submitted
                        FROM hakemukset
                        WHERE hakemus_type = 'hakemus' AND
                              status = 'submitted' AND
                              version = submitted_version
                        GROUP BY id
                      )
                      SELECT
                        hakemukset.id,
                        hakemukset.register_number AS asianumero,
                        avustushaku.hallinnoiavustuksia_register_number AS avustushaku_asianumero,
                        koodi.code as toimintayksikko,
                        hakemukset.language,
                        hakemukset.budget_total,
                        to_char(hakemus_submitted.first_time_submitted, 'DD.MM.YYYY') AS vireille_tulo_pvm,
                        forms.content,
                        form_submissions.answers,
                        arviot.status as paatos_status,
                        arviot.budget_granted as myonnetty,
                        avustushaku.decision->'date' AS paatos_ratkaisu_pvm,
                        avustushaku.content->'name'->'fi' AS kayttotarkoitus
                      FROM hakemukset
                      LEFT JOIN arviot ON arviot.hakemus_id = hakemukset.id
                      LEFT JOIN avustushaut avustushaku ON avustushaku.id = hakemukset.avustushaku
                      LEFT JOIN va_code_values koodi ON koodi.id = avustushaku.operational_unit_id
                      LEFT JOIN hakemus_submitted ON hakemus_submitted.id = hakemukset.id
                      LEFT JOIN form_submissions ON form_submissions.id = hakemukset.form_submission_id AND
                                                    form_submissions.version_closed IS NULL
                      LEFT JOIN forms ON avustushaku.form = forms.id
                      WHERE hakemukset.version_closed IS NULL AND
                            hakemus_type = 'hakemus' AND
                            arviot.status in ('accepted', 'rejected') AND
                            avustushaku = ?
                      ORDER BY hakemukset.id ASC" [avustushaku-id])
        output                (ByteArrayOutputStream.)
        wb                    (spreadsheet/create-workbook main-sheet-name-hallinnoiavustuksia
                                                           (apply conj
                                                                  [hallinnoiavustuksia-column-labels]
                                                                  (mapv avustushaku->hallinoi-sheet-rows data)))
        main-sheet            {:sheet              (spreadsheet/select-sheet main-sheet-name-hallinnoiavustuksia wb)
                               :header-row-indexes #{0}}
        safe-formula-style    (doto (.createCellStyle wb)
                                (.setQuotePrefixed true))
        header-style          (spreadsheet/create-cell-style! wb {:font       {:bold true}})]

    (adjust-cells-style! main-sheet header-style safe-formula-style)
    (.write wb output)
    (.toByteArray output)))
