(ns oph.soresu.form.validation
  (:use [clojure.tools.trace :only [trace]])
  (:require [clojure.string :as string]
            [oph.soresu.common.math :as math]
            [oph.soresu.common.validation :as validation]
            [oph.soresu.form.formutil :refer :all]
            [oph.soresu.form.rules :as rules]))

(defn- validate-required [field answer]
  (if (and (:required field)
           (empty? answer))
    [{:error "required"}]
    []))

(defn- is-valid-option-value? [options value]
  (some #{value} (map (fn [option] (option :value)) options)))

(defn- is-valid-option? [options values]
  (if (coll? values)
    (every? (partial is-valid-option-value? options) values)
    (is-valid-option-value? options values)))

(defn- validate-options [field answer]
  (if (and (> (count (field :options)) 0)
           (not (empty? answer))
           (not (is-valid-option? (field :options) answer)))
    [{:error "invalid-option"}]
    []))

(defn- validate-textarea-maxlength [field answer]
  (let [maxlength ((get field :params {}) :maxlength)]
    (if (and (has-field-type? "textArea" field)
             (> (count answer) maxlength))
      [{:error "maxlength", :info {:max maxlength}}]
      [])))

(defn- validate-texfield-maxlength [field answer]
  (let [maxlength ((get field :params {}) :maxlength)]
    (if (and (has-field-type? "textField" field)
             (> (count answer) maxlength))
      [{:error "maxlength", :info {:max maxlength}}]
      [])))

(defn- validate-email-security [field answer]
  (if (and (has-field-type? "emailField" field)
           (not (nil? answer))
           (or (re-matches #".*%0[aA].*" answer)
               (> (count answer) 254)))
    [{:error "email"}]
    []))

(defn- validate-no-unicode-null-character [field answer]
  (if (and (or (has-field-type? "textArea" field)
               (has-field-type? "textField" field))
           (not (nil? answer))
           (validation/contains-escaped-unicode-null answer))
    [{:error "field contains escaped unicode null character \u0000"}]
    []))

(defn- validate-email-field [field answer]
  (if (or (not (has-field-type? "emailField" field))
          (empty? answer))
    []
    (if (validation/email-address? answer)
      []
      [{:error "email"}])))

(defn- validate-integer-field [field answer]
  (if (or (not (has-field-type? "integerField" field))
          (empty? answer))
    []
    (if (validation/parseable-as-integer? answer)
      []
      [{:error "integer"}])))

(defn- validate-decimal-field [field answer]
  (if (or (not (has-field-type? "decimalField" field))
          (empty? answer))
    []
    (if (validation/parseable-as-decimal? answer)
      []
      [{:error "decimal"}])))

(defn- validate-finnish-business-id-field [field answer]
  (if (or (not (has-field-type? "finnishBusinessIdField" field))
          (empty? answer))
    []
    (if (validation/finnish-business-id? answer)
      []
      [{:error "finnishBusinessId"}])))

(defn- validate-attachment [attachments field]
  (if (and (not (contains? attachments (:id field)))
           (:required field))
    [{:error "required"}]
    []))

(defn- validate-table-field-dimensions [field answer]
  (if (and (not (coll? answer))
           (empty? answer))
    []
    (if (and (coll? answer)
             (every? #(and (coll? %) (every? string? %)) answer))
      (let [num-columns    (-> field :params :columns count)
            num-fixed-rows (or (-> field :params :rows count) 0)]
        (if (or (= num-fixed-rows 0)
                (= num-fixed-rows (count answer)))
          (if (every? #(= num-columns (count %)) answer)
            []
            [{:error "table-has-row-with-unexpected-number-of-columns"}])
          [{:error "table-has-unexpected-number-of-rows"}]))
      [{:error "table-is-not-two-dimensional"}])))

(defn- validate-table-field-cell-max-size [max-size value]
  (if (some? max-size)
    (<= (count value) max-size)
    true))

(defn- validate-table-field-cell-is-nonempty [^String value]
  (-> value string/trim seq))

(defn- validate-table-field-cell-is-valid-type [type ^String value]
  (condp = type
    "integer" (math/represents-integer? value)
    "decimal" (math/represents-decimal? value)
    true))

(defn- validate-table-field-cell-value [row-required? col-required? type value]
  (let [value-str      (str value)
        empty-value?   (-> value string/trim empty?)
        cell-required? (and row-required? col-required?)]
    (cond
      (and cell-required? empty-value?) false
      (and (not empty-value?) (not (validate-table-field-cell-is-valid-type type value-str))) false
      :else true)))

(defn- parse-table-field-required-param [val]
  (if (instance? Boolean val)
    val
    true))

(defn- validate-table-field-cells [field answer]
  (let [column-params-by-column (vec (get-in field [:params :columns]))
        row-params-by-row       (vec (get-in field [:params :rows]))
        validate-cell           (fn [row-idx col-idx value]
                                  (let [col-params (get column-params-by-column col-idx)
                                        row-params (get row-params-by-row row-idx)]
                                    (if (validate-table-field-cell-max-size (:maxlength col-params) value)
                                      (if (validate-table-field-cell-value (parse-table-field-required-param (:required row-params))
                                                                           (parse-table-field-required-param (:required col-params))
                                                                           (:valueType col-params)
                                                                           value)
                                        nil
                                        "table-has-cell-with-invalid-value")
                                      "table-has-cell-exceeding-max-length")))]
    (if-some [cell-error (some (fn [[row-idx row]]
                                 (some (fn [[col-idx cell]]
                                         (validate-cell row-idx col-idx cell))
                                       (map-indexed vector row)))
                               (map-indexed vector answer))]
      [{:error cell-error}]
      [])))

(defn- validate-table-field [answers field]
  (let [answer (find-answer-value answers (:id field))
        required-validation (validate-required field answer)]
    (if (empty? required-validation)
      (let [dimensions-validation (validate-table-field-dimensions field answer)]
        (if (and (empty? dimensions-validation)
                 (seq answers))
          (validate-table-field-cells field answer)
          dimensions-validation))
      required-validation)))

(defn- validate-generic-field [answers field]
  (let [answer (find-answer-value answers (:id field))]
    (concat
     (validate-required field answer)
     (validate-options field answer)
     (validate-textarea-maxlength field answer)
     (validate-texfield-maxlength field answer)
     (validate-email-field field answer)
     (validate-no-unicode-null-character field answer)
     (validate-integer-field field answer)
     (validate-decimal-field field answer)
     (validate-finnish-business-id-field field answer))))

(defn- validate-field-by-type [answers attachments field]
  (condp = (:fieldType field)
    "namedAttachment" (validate-attachment attachments field)
    "tableField"      (validate-table-field answers field)
    (validate-generic-field answers field)))

(defn create-missing-fields [form answers attachments]
  (let [fields  (find-fields (:content (rules/apply-rules form answers attachments)))
        growing-fieldsets (filter (fn [x] (= (:fieldType x) "growingFieldset")) (:value answers))
        answers-to-validate (flatten (mapcat (fn [fieldset] (map (fn [x] (:value x)) (:value fieldset))) growing-fieldsets))
        matching-fields (filter (fn [field] (some (fn [answer] (= (:key answer) (:id field))) answers-to-validate)) fields)
        missing-fields (filter (fn [answer] (not (some (fn [field] (= (:key answer) (:id field))) matching-fields))) answers-to-validate)
        new-fields (map (fn [missing]
                          (let [renamed-answer-field (string/replace-first (:key missing) #"\d+" "1")
                                found-form-field (first (filter (fn [x] (= (:id x) renamed-answer-field))   matching-fields))]
                            (assoc found-form-field :id (:key missing)))) missing-fields)]
    new-fields))

(defn validate-field [answers attachments field]
  (let [field-id    (keyword (:id field))
        validations (validate-field-by-type answers attachments field)]
    {field-id validations}))

(defn validate-form [form answers attachments]
  (let [applied-form (rules/apply-rules form answers attachments)
        validator (partial validate-field answers attachments)]
    (->> (concat (find-fields (:content applied-form)) (create-missing-fields form answers attachments))
         (map validator)
         (into {}))))

(defn validate-field-security [answers field]
  (let [answer (find-answer-value answers (:id field))]
    {(keyword (:id field)) (concat
                            (validate-options field answer)
                            (validate-textarea-maxlength field answer)
                            (validate-texfield-maxlength field answer)
                            (validate-email-security field answer)
                            (validate-no-unicode-null-character field answer))}))

(defn validate-form-security [form answers]
  (let [applied-form (rules/apply-rules form answers {})
        validator (partial validate-field-security answers)]
    (->> (find-fields (:content applied-form))
         (map validator)
         (into {}))))
