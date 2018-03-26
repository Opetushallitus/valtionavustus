(ns oph.va.admin-ui.utils
  (:require [goog.string :as gstring]
            [goog.string.format]))

(defn format [fmt & args] "Format string" (apply gstring/format fmt args))

(defn parse-int
  ([s d]
   (let [parsed (js/parseInt s)]
     (if (js/isNaN parsed) d parsed)))
  ([s] (parse-int s nil)))
