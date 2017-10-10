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

(defn- validate-email-field [field answer]
  (if (or (not (has-field-type? "emailField" field))
          (empty? answer))
    []
    (if (validation/email-address? answer)
      []
      [{:error "email"}])))

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

(defn- validate-table-field-cell-value [type value]
  (let [as-str (str value)]
    (and (validate-table-field-cell-is-nonempty as-str)
         (validate-table-field-cell-is-valid-type type as-str))))

(defn- validate-table-field-cell [field answer]
  (let [max-sizes-by-column (->> field
                                 :params
                                 :columns
                                 (mapv :maxlength))
        types-by-column     (->> field
                                 :params
                                 :columns
                                 (mapv :valueType))
        validate-cell       (fn [col-idx value]
                              (if (validate-table-field-cell-max-size (get max-sizes-by-column col-idx) value)
                                (if (validate-table-field-cell-value (get types-by-column col-idx) value)
                                  nil
                                  "table-has-cell-with-invalid-value")
                                "table-has-cell-exceeding-max-length"))]
    (if-some [cell-error (some #(some identity (map-indexed validate-cell %)) answer)]
      [{:error cell-error}]
      [])))

(defn- validate-table-field [answers field]
  (let [answer (find-answer-value answers (:id field))
        required-validation (validate-required field answer)]
    (if (empty? required-validation)
      (let [dimensions-validation (validate-table-field-dimensions field answer)]
        (if (and (empty? dimensions-validation)
                 (seq answers))
          (validate-table-field-cell field answer)
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
     (validate-finnish-business-id-field field answer))))

(defn- validate-field-by-type [answers attachments field]
  (condp = (:fieldType field)
    "namedAttachment" (validate-attachment attachments field)
    "tableField"      (validate-table-field answers field)
    (validate-generic-field answers field)))

(defn validate-field [answers attachments field]
  (let [field-id    (keyword (:id field))
        validations (validate-field-by-type answers attachments field)]
    {field-id validations}))

(defn validate-form [form answers attachments]
  (let [applied-form (rules/apply-rules form answers attachments)
        validator (partial validate-field answers attachments)]
    (->> (find-fields (:content applied-form))
         (map validator)
         (into {}))))

(defn validate-field-security [answers field]
  (let [answer (find-answer-value answers (:id field))]
    {(keyword (:id field)) (concat
       (validate-options field answer)
       (validate-textarea-maxlength field answer)
       (validate-texfield-maxlength field answer)
       (validate-email-security field answer))}))

(defn validate-form-security [form answers]
  (let [applied-form (rules/apply-rules form answers {})
        validator (partial validate-field-security answers)]
    (->> (find-fields (:content applied-form))
         (map validator)
         (into {}))))
