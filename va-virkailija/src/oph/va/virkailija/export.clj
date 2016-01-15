(ns oph.va.virkailija.export
  (:use [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [clojure.set :refer :all]
            [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.soresu.form.formutil :as formutil]
            [oph.soresu.form.formhandler :as formhandler]
            [oph.va.virkailija.hakudata :as hakudata])
  (:import [java.io ByteArrayOutputStream ByteArrayInputStream]))

(def main-sheet-name "Hakemukset")
(def main-sheet-columns ["Diaarinumero"
                         "Hakijaorganisaatio"
                         "Hankkeen nimi"
                         "Ehdotettu budjetti"
                         "OPH:n avustuksen osuus"
                         "Myönnetty avustus"
                         "Arviokeskiarvo"])

(def answers-sheet-name "Vastaukset")

(def answers-fixed-fields
  [["fixed-register-number" "Diaarinumero" :register-number {:fieldType "textField"}]
   ["fixed-organization-name" "Hakijaorganisaatio" :organization-name {:fieldType "textField"}]
   ["fixed-project-name" "Projektin nimi" :project-name {:fieldType "textField"}]
   ["fixed-budget-total" "Ehdotettu budjetti" :budget-total {:fieldType "numberField"}]
   ["fixed-budget-oph-share" "OPH:n avustuksen osuus" :budget-oph-share {:fieldType "numberField"}]
   ["fixed-budget-granted" "Myönnetty avustus" (comp :budget-granted :arvio) {:fieldType "numberField"}]
   ["fixed-score-total-average" "Arviokeskiarvo" (comp :score-total-average :scoring :arvio) {:fieldType "numberField"}]])

(defn third [list] (nth list 2))
(defn fourth [list] (nth list 3))

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

(defn- valid-hakemus? [hakemus]
  (or (= (:status hakemus) "submitted")
      (= (:status hakemus) "pending_change_request")))

(defn- field->type [field]
  (let [add-options (fn [type-map]
                (if (:options field)
                  (assoc type-map :options (:options field))
                  type-map))]
    (-> {}
        (assoc :fieldType (:fieldType field))
        add-options)))

(defn- field->label [avustushaku field parent suffix]
  (if (= (:fieldType field) "vaFocusAreas")
    (->> avustushaku :avustushaku :content :focus-areas :label :fi)
    (str (or (-> field :label :fi)
             (-> parent :label :fi)) suffix)))

(defn- mark-and-reject-growing-fields [avustushaku wrappers data field]
  (let [parent (find-parent wrappers (:id field))
        grandparent (find-parent wrappers (:id parent))
        add-reject (fn [data]
                     (assoc data :rejects (conj (:rejects data) (:id grandparent))))
        add-value (fn [data value]
                    (assoc data :values (conj (:values data) value)))
        add-options (fn [type-map]
                      (if (:options field)
                        (assoc type-map :options (:options field))
                        type-map))]
    (if (= "growingFieldset" (:fieldType grandparent))
      ;; Special case: handle growing field sets by placing marker
      (let [reject? (contains? (-> data :rejects) (:id grandparent))
            data (add-reject data)]
        (if reject?
          data
          (add-value data {:growingField (:id grandparent)})))

      ;; Normal case - add value to data
      (add-value data [(:id field)
                       (field->label avustushaku field parent "")
                       (field->type field)]))))

(defn- process-growing-field [avustushaku fields wrappers id]
  (let [seq-number (last (re-find #"([0-9]+)[^0-9]*$" id))
        mangled-id (clojure.string/replace id #"[0-9]+([^0-9]*)$" "1$1")
        field (->> fields
                   (filter (fn [f] (= (:id f) mangled-id)))
                   first)
        parent (find-parent wrappers field)]
    [id
     (field->label avustushaku field parent (str " " seq-number))
     (field->type field)]))

(defn- inject-growing-fieldsets [avustushaku fields wrappers growing-fieldset-lut triples]
  (if (map? triples)
    (let [fieldset-id (:growingField triples)
          fieldset-lut (get growing-fieldset-lut fieldset-id)]
      (->> (keys fieldset-lut)
           (reduce (fn [acc entry]
                     (apply conj acc (mapv (partial process-growing-field
                                                    avustushaku
                                                    fields
                                                    wrappers)
                                           (get fieldset-lut entry))))
                   [])))
    triples))

(defn- unwrap-double-nested-lists [list item]
  (if (vector? (first item))
    (apply conj list item)
    (conj list item)))

(defn- avustushaku->formlabels [avustushaku growing-fieldset-lut]
  (let [form (->> avustushaku
                  :form
                  (formhandler/add-koodisto-values :hakija-db)
                  :content)
        fields (formutil/find-fields form)
        wrappers (formutil/find-wrapper-elements form)]
    (->> form
         (formutil/find-fields)
         (reduce (partial mark-and-reject-growing-fields avustushaku wrappers) {:rejects #{} :values []})
         :values
         (map (partial inject-growing-fieldsets avustushaku fields wrappers growing-fieldset-lut))
         (reduce unwrap-double-nested-lists [])
         (filter (comp not empty?)))))

(defn- avustushaku->hakemukset [avustushaku]
  (->> (:hakemukset avustushaku)
       (filter valid-hakemus?)))

(defn- hakemus->map [hakemus]
  (let [answers (formutil/unwrap-answers (:answers hakemus) ["checkboxButton" "vaFocusAreas"])]
    (reduce (fn [answer-map [field-name _ lookup-fn]]
              (assoc answer-map field-name (lookup-fn hakemus)))
            answers
            answers-fixed-fields)))

(defn- str->float [str]
  (if str
    (read-string (clojure.string/replace str "," "."))
    nil))

(defn- str->int [str]
  (if str
    (read-string str)
    nil))

(defn get-by-id [avustushaku answer-set id answer-type]
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
                            (clojure.string/join "; ")))
    "vaFocusAreas" (let [value (get answer-set id)
                         focus-areas (->> avustushaku
                                          :avustushaku
                                          :content
                                          :focus-areas
                                          :items)]
                     (->> value
                          (map (fn [val] (->> val
                                              (re-find #".*([0-9]+)$")
                                              last
                                              (Long/parseLong))))
                          (map (fn [index] (->> (nth focus-areas index)
                                                :fi)))
                          (clojure.string/join "; ")))
    "moneyField" (str->int (get answer-set id))
    "vaTraineeDayCalculator" (str->float (get answer-set (str id ".total")))
    (get answer-set id)))

(defn- extract-answer-values [avustushaku answer-keys answer-types answers]
  (let [extract-answers (fn [answer-set] (mapv (partial get-by-id avustushaku answer-set) answer-keys answer-types))]
    (mapv extract-answers answers)))

(defn flatten-answers [avustushaku answer-keys answer-labels answer-types]
  (let [hakemukset (avustushaku->hakemukset avustushaku)
        answers (map hakemus->map hakemukset)
        flat-answers (->> (extract-answer-values avustushaku answer-keys answer-types answers)
                          (sort-by first))]
    (apply conj [answer-labels] flat-answers)))

(defn generate-growing-fieldset-lut [avustushaku]
  (let [answer-list (->> (avustushaku->hakemukset avustushaku)
                         (sort-by first)
                         (map :answers))
        descend-to-child (fn [acc child]
                           (conj acc [(:key child) (mapv :key (:value child))]))
        convert-answers-to-lookup-table (fn [value]
                                          (array-map (:key value) (reduce descend-to-child (array-map) (:value value))))
        process-answers (fn [answers] (->> answers
                                           (filter (fn [value] (vector? (:value value))))
                                           (mapv convert-answers-to-lookup-table)))
        combine (fn [accumulated single-entry]
                  (reduce (fn [acc item]
                            (merge-with merge acc item))
                          accumulated
                          single-entry))]
    (->> answer-list
         (mapv process-answers)
         (reduce combine (array-map)))))

(def hakemus->main-sheet-rows
  (juxt :register-number
        :organization-name
        :project-name
        :budget-total
        :budget-oph-share
        (comp :budget-granted :arvio)
        (comp :score-total-average :scoring :arvio)))

(defn- fit-columns [columns sheet]
  ;; Make columns fit the data
  (doseq [index (range 0 (count columns))]
    (.autoSizeColumn sheet index)))

(defn export-avustushaku [avustushaku-id]
  (let [avustushaku (hakudata/get-combined-avustushaku-data avustushaku-id)
        hakemus-list (->> (avustushaku->hakemukset avustushaku)
                          (sort-by first))

        output (ByteArrayOutputStream.)

        main-sheet-rows (mapv hakemus->main-sheet-rows hakemus-list)
        wb (spreadsheet/create-workbook main-sheet-name
                                        (apply conj [main-sheet-columns] main-sheet-rows))

        main-sheet (spreadsheet/select-sheet main-sheet-name wb)
        main-header-row (first (spreadsheet/row-seq main-sheet))

        growing-fieldset-lut (generate-growing-fieldset-lut avustushaku)

        answer-key-label-type-triples (avustushaku->formlabels avustushaku growing-fieldset-lut)

        answer-keys (apply conj
                           (mapv first answers-fixed-fields)
                           (mapv first answer-key-label-type-triples))
        answer-labels (apply conj
                             (mapv second answers-fixed-fields)
                             (mapv second answer-key-label-type-triples))
        answer-types (apply conj
                            (mapv fourth answers-fixed-fields)
                            (mapv third answer-key-label-type-triples))

        answer-flatdata (flatten-answers avustushaku answer-keys answer-labels answer-types)
        answers-sheet (let [sheet (spreadsheet/add-sheet! wb answers-sheet-name)]
                        (spreadsheet/add-rows! sheet answer-flatdata)
                        sheet)
        answers-header-row (first (spreadsheet/row-seq answers-sheet))

        header-style (spreadsheet/create-cell-style! wb {:background :yellow
                                                         :font {:bold true}})]

    (fit-columns main-sheet-columns main-sheet)
    (fit-columns answer-keys answers-sheet)

    ;; Style first row
    (spreadsheet/set-row-style! main-header-row header-style)
    (spreadsheet/set-row-style! answers-header-row header-style)

    (.write wb output)
    (ByteArrayInputStream. (.toByteArray output))))
