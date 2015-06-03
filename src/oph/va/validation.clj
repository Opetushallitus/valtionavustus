(ns oph.va.validation
  (:require [clojure.string :as string]))

(defn validate-required [field answer]
  (if (and (= (field :required) true) (string/blank? answer))
    [{:error "required"}]
    []))

(defn validate-options [field answer]
  (if (and (> (count (field :options)) 0) (not-any? #{answer} (map (fn [option] (option :value)) (field :options))))
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

(defn validate-field [field answers]
  (let [answer (answers (keyword (field :id)))]
    {(keyword (field :id)) (concat
       (validate-required field answer)
       (validate-options field answer)
       (validate-textarea-maxlength field answer)
       (validate-texfield-maxlength field answer))}))

(defn validate-form [form answers]
  (into {} (map (fn [field] (validate-field field answers)) ((form :content) :fields))))