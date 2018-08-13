(ns oph.va.admin-ui.utils
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [cljs.core.async :refer [<! put! close! poll! chan timeout]]
            [goog.string :as gstring]
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

(defn delayed [delay-ms f & args]
  (let [c (chan)]
    (go
      (<! (timeout delay-ms))
      (when (nil? (poll! c))
        (apply f args)
        (close! c)))
    c))

(defn cancel! [d]
  (put! d :cancel))
