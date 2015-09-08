(ns oph.form.rules
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.form.formutil :refer :all]))

(defn include-if [form-state rule]
  (let [trigger-value (:triggerValue (:params rule))
        answers-value  (find-answer-value (:answers form-state) (:triggerId rule))
        target-ids (:targetIds rule)]
    (if (= trigger-value answers-value)
      form-state
      (assoc form-state :form (transform-form-content (:form form-state)
        (fn [node]
          (if (some #{(:id node)} target-ids)
            {}
            node)))))))

(defn apply-rule [form-state rule]
  (case (:type rule)
    "includeIf" (include-if form-state rule)
    (throw (ex-info (str "Unknown form rule of type " (:type rule)) rule))))

(defn apply-rules [form answers]
  (:form (reduce apply-rule {:form form, :answers answers}  (:rules form))))
