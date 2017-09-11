(ns oph.soresu.form.formutil
  (:require [clojure.walk :as walk]
            [clojure.tools.trace :refer [trace]]))

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

(defn is-form-field? [field]
  (has-attribute? :fieldClass "formField" field))

(defn is-wrapper-element? [field]
  (has-attribute? :fieldClass "wrapperElement" field))

(defn is-info-element? [field]
  (has-attribute? :fieldClass "infoElement" field))

(defn in? [seq element] (some #(= element %) seq))

(defn unwrap-answers
  "Unwraps answers to normal map structure. Parameter list-valued-types contains names of
   types that are expected to contain vector-typed values. This prevents recursion from
   descending to such values and instead returns the value as list"
  [answers list-valued-types]
  (let [pair (fn [answer] [(:key answer) (:value answer)])
        unwrap (fn [accumulator answer]
                 (if (and (vector? (:value answer))
                          (not (in? list-valued-types (:fieldType answer))))
                   (conj accumulator (unwrap-answers (:value answer) list-valued-types))
                   (conj accumulator (pair answer))))]
    (->> (reduce unwrap [] answers)
         (into {}))))

(declare flatten-elements)

(defn unwrap-node [node]
  (if (is-wrapper-element? node)
    (list* node (flatten-elements (:children node)))
    node))

(defn flatten-elements [node-list]
  (->> node-list
     (map unwrap-node)
     flatten))

(defn find-fields* [predicate node-list]
  (->> node-list
       flatten-elements
       (filter predicate)))

(defn find-fields [node-list]
  (find-fields* is-form-field? node-list))

(defn find-wrapper-elements [node-list]
  (find-fields* is-wrapper-element? node-list))

(defn decorate-matching [form lookup-table]
  (let [field-list (find-fields (:content form))]
    (letfn [(find-match [field]
              (->> lookup-table
                   keys
                   (map (fn [r] {:match (r field)
                                 :result (get lookup-table r)}))
                   (filter :match)
                   (map (fn [match-object] {:field field :result (:result match-object)}))
                   first))]
      (map find-match field-list))))

(defn- recursively-generate [value value-fn include-fn?]
  (letfn [(convert [value]
            (if (is-form-field? value)
              (when (include-fn? value)
                {:key (:id value)
                 :value (value-fn value)
                 :fieldType (:fieldType value)})
              (when (is-wrapper-element? value)
                (recursively-generate (:children value) value-fn include-fn?))))]
    (->> (mapv convert value)
         (flatten)
         (filterv identity))))

(defn generate-answers [form value-fn include-fn?]
  {:value (recursively-generate (:content form) value-fn include-fn?)})
