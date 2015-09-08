(ns oph.form.formutil
  (:require [clojure.walk :as walk]))

(defn transform-form-content [form node-transformer]
  (let [new-content (walk/prewalk node-transformer (:content form))]
    (assoc form :content new-content)))

(defn find-value-for-key [values key]
  (if (some #(= key (:key %)) values)
    (first (filter #(= key (:key %)) values))
    (let [values-that-are-maps (filter map? values)
          nested-map-values (map #(:value %) values-that-are-maps)
          values-that-are-seqs (filter coll? nested-map-values)
          nested-seq-values (mapcat #(:value %) (flatten values-that-are-seqs))
          all-internal-values (concat nested-map-values nested-seq-values)]
      (when (not (empty? all-internal-values))
        (find-value-for-key all-internal-values key)))))

(defn find-answer-value [answers key]
  (when-let [found-record (find-value-for-key (answers :value) key)]
    (:value found-record)))

(defn has-attribute? [attribute-name expected-value field]
  (= (attribute-name field) expected-value))

(defn has-display-as? [expected-value field]
  (has-attribute? :displayAs expected-value field))

(defn- is-form-field? [field]
  (has-attribute? :type "formField" field))

(defn- is-wrapper-element? [field]
  (has-attribute? :type "wrapperElement" field))

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
