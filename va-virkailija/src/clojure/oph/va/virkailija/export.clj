(ns oph.va.virkailija.export
  (:use [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [clojure.set :as clj-set]
            [clojure.string :as string]
            [clj-time.core :as clj-time]
            [clj-time.format :as clj-time-format]
            [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.soresu.form.formutil :as formutil]
            [oph.soresu.form.formhandler :as formhandler])
  (:import [java.io ByteArrayOutputStream]
           [org.apache.poi.ss.usermodel Cell CellStyle CellType Sheet]
           [org.joda.time DateTime]))

(def unsafe-cell-string-value-prefixes "=-+@")

(def column-default-width-in-chars 30)

(def cell-value-no-fit-threshold-in-chars 40)

(def main-sheet-name "Hakemukset")

(def main-sheet-columns ["Diaarinumero"
                         "Hakijaorganisaatio"
                         "Hankkeen nimi"
                         "Asiointikieli"
                         "Ehdotettu budjetti"
                         "OPH:n avustuksen osuus"
                         "Myönnetty avustus"
                         "Arviokeskiarvo"])

(def hakemus->main-sheet-rows
  (juxt :register-number
        :organization-name
        :project-name
        :language
        :budget-total
        :budget-oph-share
        (comp :budget-granted :arvio)
        (comp :score-total-average :scoring :arvio)))

(def hakemus-answers-sheet-name "Hakemuksien vastaukset")

(def hakemus-answers-sheet-fixed-fields
  [["fixed-register-number" "Diaarinumero" :register-number {:fieldType "textField"}]
   ["fixed-organization-name" "Hakijaorganisaatio" :organization-name {:fieldType "textField"}]
   ["fixed-project-name" "Projektin nimi" :project-name {:fieldType "textField"}]
   ["fixed-language" "Asiointikieli" :language {:fieldType "textField"}]
   ["fixed-budget-total" "Ehdotettu budjetti" :budget-total {:fieldType "numberField"}]
   ["fixed-budget-oph-share" "OPH:n avustuksen osuus" :budget-oph-share {:fieldType "numberField"}]
   ["fixed-budget-granted" "Myönnetty avustus" (comp :budget-granted :arvio) {:fieldType "numberField"}]
   ["fixed-score-total-average" "Arviokeskiarvo" (comp :score-total-average :scoring :arvio) {:fieldType "numberField"}]])

(def loppuselvitys-answers-sheet-name "Loppuselvityksien vastaukset")

(def loppuselvitys-answers-sheet-fixed-fields
  [["fixed-register-number" "Diaarinumero" :register-number {:fieldType "textField"}]
   ["fixed-organization-name" "Hakijaorganisaatio" :organization-name {:fieldType "textField"}]
   ["fixed-project-name" "Projektin nimi" :project-name {:fieldType "textField"}]
   ["fixed-language" "Asiointikieli" :language {:fieldType "textField"}]
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
   "Toiminto"
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
        (constantly "XA")
        :paatos-date
        :lkp
        (constantly "")
        :payment
        (constantly "")
        :takp
        (constantly "")
        (constantly "")
        (constantly "6600151502")
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
  (let [add-options (fn [type-map]
                (if (:options field)
                  (assoc type-map :options (:options field))
                  type-map))]
    (-> {}
        (assoc :fieldType (:fieldType field))
        add-options)))

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
                       (formhandler/add-koodisto-values :form-db)
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

(defn- remove-white-spaces [str]
  (string/replace str #"\s" ""))

(defn- comma-to-dot [str]
  (string/replace str "," "."))

(defn- remove-dots [str]
  (string/replace str "." ""))

(defn- str->float [str]
  (when (not (empty? str))
    (Float/parseFloat (comma-to-dot (remove-white-spaces str)))))

(defn- str->int [str]
  (when (not (empty? str))
    (Integer/parseInt (remove-white-spaces str))))

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

(defn- unsafe-string-cell-value? [^String value]
  (if (.isEmpty value)
    false
    (let [value-first-char (.codePointAt value 0)]
      (>= (.indexOf unsafe-cell-string-value-prefixes value-first-char) 0))))

(defn- quote-string-cell-with-formula-like-value! [^Cell cell ^CellStyle safe-formula-style]
  (when (and (= (.getCellTypeEnum cell) CellType/STRING)
             (unsafe-string-cell-value? (.getStringCellValue cell)))
    (.setCellStyle cell safe-formula-style)))

(defn- fit-cell? [^Cell cell]
  (let [value-str (-> cell spreadsheet/read-cell str)]
    (if (>= (count value-str) cell-value-no-fit-threshold-in-chars)
      (let [str-rows (string/split value-str #"\n")]
        (not-any? #(>= (count %) cell-value-no-fit-threshold-in-chars) str-rows))
      true)))

(defn- adjust-cells-style! [^Sheet sheet ^CellStyle header-style ^CellStyle safe-formula-style]
  (.setDefaultColumnWidth sheet column-default-width-in-chars)
  (spreadsheet/set-row-style! (.getRow sheet 0) header-style)
  (let [cols-not-to-fit (reduce (fn [cols-not-to-fit row]
                              (reduce-kv (fn [cols-not-to-fit col-idx cell]
                                           (if (some? cell)
                                             (do
                                               (quote-string-cell-with-formula-like-value! cell safe-formula-style)
                                               (if (fit-cell? cell)
                                                 cols-not-to-fit
                                                 (conj cols-not-to-fit col-idx)))
                                             cols-not-to-fit))
                                         cols-not-to-fit
                                         (vec (spreadsheet/cell-seq row))))
                            #{}
                            (spreadsheet/row-seq sheet))
        cols-to-fit (clj-set/difference (set (range 0 (-> sheet (.getRow 0) .getLastCellNum)))
                                        cols-not-to-fit)]
    (doseq [col-idx cols-to-fit]
      (.autoSizeColumn sheet col-idx))))

(def lkp-map {:kunta_kirkko                         82000000
              :kunta-kuntayhtymae                   82000000

              :liiketalous                          82300000
              :yksityinen-yhteisoe                  82300000

              :julkisoikeudellinen-yhteisoe         82500000
              :rekisteroeity-yhteisoe-tai-saeaetioe 82500000
              :voittoa_tavoittelematon              82500000

              :ei-eu-maat                           82800000

              :eu-maat                              82820000

              :yliopisto                            82930000

              :valtio                               82950000})

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
        answer-sets                   (map (partial hakemus->answers-sheet-map fixed-fields)
                                           hakemukset)
        all-answers-rows              (mapv (partial answers->strs answer-keys answer-types va-focus-areas-items)
                                            answer-sets)]
    (apply conj [answer-labels] all-answers-rows)))

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

(defn export-avustushaku [avustushaku-combined]
  (let [avustushaku           (:avustushaku avustushaku-combined)
        va-focus-areas-label  (-> avustushaku :content :focus-areas :label :fi)
        va-focus-areas-items  (-> avustushaku :content :focus-areas :items)
        paatos-date           (-> avustushaku :decision :date)
        has-multiple-maksuera (-> avustushaku :content :multiplemaksuera)
        hakemus-form          (:form avustushaku-combined)
        hakemus-list          (:hakemukset avustushaku-combined)
        loppuselvitys-form    (:form_loppuselvitys avustushaku-combined)
        loppuselvitys-list    (:loppuselvitykset avustushaku-combined)

        output (ByteArrayOutputStream.)

        wb (spreadsheet/create-workbook main-sheet-name
                                        (make-main-sheet-rows hakemus-list))

        main-sheet (spreadsheet/select-sheet main-sheet-name wb)

        hakemus-answers-sheet (doto (spreadsheet/add-sheet! wb hakemus-answers-sheet-name)
                                (spreadsheet/add-rows! (make-answers-sheet-rows hakemus-form
                                                                                hakemus-list
                                                                                va-focus-areas-label
                                                                                va-focus-areas-items
                                                                                hakemus-answers-sheet-fixed-fields)))

        loppuselvitys-answers-sheet (doto (spreadsheet/add-sheet! wb loppuselvitys-answers-sheet-name)
                                      (spreadsheet/add-rows! (make-answers-sheet-rows loppuselvitys-form
                                                                                      loppuselvitys-list
                                                                                      va-focus-areas-label
                                                                                      va-focus-areas-items
                                                                                      loppuselvitys-answers-sheet-fixed-fields)))

        maksu-sheet (doto (spreadsheet/add-sheet! wb maksu-sheet-name)
                      (spreadsheet/add-rows! (make-maksu-sheet-rows (filter #(= "accepted" (-> % :arvio :status)) hakemus-list)
                                                                    paatos-date
                                                                    has-multiple-maksuera)))

        header-style (spreadsheet/create-cell-style! wb {:background :yellow
                                                         :font       {:bold true}})

        safe-formula-style (doto (.createCellStyle wb)
                             (.setQuotePrefixed true))]

    (doseq [sheet [main-sheet
                   hakemus-answers-sheet
                   loppuselvitys-answers-sheet
                   maksu-sheet]]
      (adjust-cells-style! sheet header-style safe-formula-style))

    (.write wb output)
    (.toByteArray output)))
