(ns oph.form.formutil
  (:require [clojure.walk :as walk]))

(defn transform-tree [document tree-key node-transformer]
  (let [new-content (walk/prewalk node-transformer (tree-key document))]
    (assoc document tree-key new-content)))

(defn transform-form-content [form node-transformer]
  (transform-tree form :content node-transformer))

(defn filter-values [pred values]
  (if (some pred values)
    (filter pred values)
    (let [values-that-are-maps (filter map? values)
          nested-map-values (map #(:value %) values-that-are-maps)
          values-that-are-seqs (filter coll? nested-map-values)
          nested-seq-values (mapcat #(:value %) (flatten values-that-are-seqs))
          all-internal-values (concat nested-map-values nested-seq-values)]
      (when (not (empty? all-internal-values))
        (filter-values pred all-internal-values)))))

(defn find-value-for-key [values key]
  (first (filter-values #(= key (:key %)) values)))

(defn find-answer-value [answers key]
  (when-let [found-record (find-value-for-key (answers :value) key)]
    (:value found-record)))

(defn has-attribute? [attribute-name expected-value field]
  (= (attribute-name field) expected-value))

(defn has-field-type? [expected-value field]
  (has-attribute? :fieldType expected-value field))

(defn- is-form-field? [field]
  (has-attribute? :fieldClass "formField" field))

(defn- is-wrapper-element? [field]
  (has-attribute? :fieldClass "wrapperElement" field))

(defn unwrap-answers [answers]
  (let [map-fields (filter map? (vals answers))]
    (if (empty? map-fields)
      answers
      (into answers (map unwrap-answers map-fields)))))

(declare flatten-elements)

(defn unwrap-node [node]
  (if (is-wrapper-element? node)
    (list* node (flatten-elements (:children node)))
    node))

(defn flatten-elements [node-list]
  (->> node-list
     (map unwrap-node)
     flatten))

(defn find-fields [node-list]
  (->> (flatten-elements node-list)
    (filter is-form-field?)))
