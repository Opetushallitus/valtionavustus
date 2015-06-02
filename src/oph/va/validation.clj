(ns oph.va.validation
  (:require [clojure.string :as string]))

(defn validate-field [field answers]
  (if (and (= (field :required) true) (string/blank? (answers (keyword (field :id)))))
    {(keyword (field :id)) ["required"]}
    {(keyword (field :id)) []}))

(defn validate-form [form answers]
  (into {} (map (fn [field] (validate-field field answers)) ((form :content) :fields))))