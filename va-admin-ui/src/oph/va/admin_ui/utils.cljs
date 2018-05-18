(ns oph.va.admin-ui.utils
  (:require [goog.string :as gstring]
            [goog.string.format]))

(defn format [fmt & args] "Format string" (apply gstring/format fmt args))

(defn parse-int
  ([s d]
   (let [parsed (js/parseInt s)]
     (if (js/isNaN parsed) d parsed)))
  ([s] (parse-int s nil)))

(defn fill
  ([coll c v]
   (if (> c (count coll))
     (into coll (replicate (- c (count coll)) v))
     coll))
  ([coll c]
   (fill coll c "")))

(defn get-answer-value [answers key]
  (get (some #(when (= (:key %) key) %) answers) :value))
