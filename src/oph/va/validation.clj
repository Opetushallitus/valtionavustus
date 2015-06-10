(ns oph.va.validation
  (:require [clojure.string :as string]))

(defn validate-required [field answer]
  (if (and (= (field :required) true) (string/blank? answer))
    [{:error "required"}]
    []))

(defn validate-options [field answer]
  (if (and (not (string/blank? answer)) (> (count (field :options)) 0) (not-any? #{answer} (map (fn [option] (option :value)) (field :options))))
    [{:error "invalid-option"}]
    []))

(defn validate-textarea-maxlength [field answer]
  (let [maxlength ((get field :params {}) :maxlength)]
    (if (and (= (field :displayAs) "textArea") (> (count answer) maxlength))
      [{:error "maxlength", :max maxlength}]
      [])))

(defn validate-texfield-maxlength [field answer]
  (let [maxlength ((get field :params {}) :maxlength)]
    (if (and (= (field :displayAs) "textField") (> (count answer) maxlength))
      [{:error "maxlength", :max maxlength}]
      [])))

(defn validate-field [answers field]
  (let [answer (answers (keyword (field :id)))]
    {(keyword (field :id)) (concat
       (validate-required field answer)
       (validate-options field answer)
       (validate-textarea-maxlength field answer)
       (validate-texfield-maxlength field answer))}))

(defn- is-form-field? [field]
  (= (:type field) "formField"))

(defn- is-wrapper-element? [field]
  (= (:type field) "wrapperElement"))

(defn- is-wrapper-or-field-element? [field]
  (or (is-form-field? field) (is-wrapper-element? field)))

(declare find-fields)

(defn process-node [node]
  (if (is-form-field? node)
    node
    (find-fields (:children node))))

(defn find-fields [node-list]
  (->> node-list
    (filter is-wrapper-or-field-element?)
    (map process-node)
    flatten))

(defn validate-form [form answers]
  (let [validator (partial validate-field answers)]
    (->> (find-fields (:content form))
       (map validator)
       (into {}))))
