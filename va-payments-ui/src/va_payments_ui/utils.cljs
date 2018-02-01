(ns va-payments-ui.utils
  (:require [goog.string :as gstring]
            [goog.string.format]
            [cljs-time.format :as tf]))

(def re-email
  #"^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

(def date-formatter (tf/formatter "dd.MM.yyyy"))

(def date-time-formatter (tf/formatter "dd.MM.yyyy HH:mm"))

(defn to-simple-date [d]
  (if (empty? d) nil (tf/unparse-local date-formatter (tf/parse d))))

(defn to-simple-date-time [d]
  (tf/unparse-local date-time-formatter (tf/parse d)))

(defn not-nil? [v] (not (nil? v)))

(defn any-nil? [m ks]
  (or (not= (count ks) (count (select-keys m ks)))
      (not-every? some? (vals (select-keys m ks)))))

(defn no-nils? [m ks]
  (let [selected-keys (select-keys m ks)]
    (and (= (count ks) (count selected-keys))
         (every? some? (vals selected-keys)))))

(defn not-empty? [v] (not (empty? v)))

(defn format [fmt & args] "Format string" (apply gstring/format fmt args))

(defn get-current-year-short []
  "Get current year as a short version (i.e. 17)"
  (mod (.getFullYear (js/Date.)) 100))

(defn parse-int [s]
  "Parse integer from string. If parsing fails (NaN) nil will be returned"
  (let [value (js/parseInt s)] (when-not (js/isNaN value) value)))

(defn assoc-all [c k v] (into [] (map #(assoc % k v) c)))

(defn remove-nil [m] (into {} (filter (comp some? val) m)))

(defn find-index-of
  ([col pred i m]
   (if (>= i m) nil (if (pred (nth col i)) i (recur col pred (inc i) m))))
  ([col pred] (find-index-of col pred 0 (count col))))

(defn valid-email? [v] (and (not-empty? v) (not-nil? (re-matches re-email v))))
