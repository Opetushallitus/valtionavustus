(ns oph.va.admin-ui.payments.utils
  (:require [cljs-time.format :as tf]
            [cljs-time.core :as t]))

(def re-email
  #"^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

(def date-formatter (tf/formatter "dd.MM.yyyy"))

(def date-time-formatter (tf/formatter "dd.MM.yyyy HH:mm"))

(def today-start (t/today-at 0 0))

(def today-end (t/today-at 23 59 59))

(defn- to-date [d f]
  (if (empty? d)
    nil
    (when-let [parsed (tf/parse d)]
      (f parsed))))

(defn to-simple-date [d]
  (to-date d #(tf/unparse-local date-formatter %)))

(defn to-simple-date-time [d]
  (to-date d #(tf/unparse-local date-time-formatter %)))

(defn not-nil? [v] (not (nil? v)))

(defn any-nil? [m ks]
  (or (not= (count ks) (count (select-keys m ks)))
      (not-every? some? (vals (select-keys m ks)))))

(defn no-nils? [m ks]
  (let [selected-keys (select-keys m ks)]
    (and (= (count ks) (count selected-keys))
         (every? some? (vals selected-keys)))))

(defn not-empty? [v] (not (empty? v)))

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

(defn is-today? [d]
  (let [date (if (string? d)
               (tf/parse d)
               d)
        today (t/today)]
    (and
      (= (t/day date) (t/day today))
      (= (t/year date) (t/year today))
      (= (t/month date) (t/month today)))))
