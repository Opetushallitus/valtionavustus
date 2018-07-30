(ns oph.va.admin-ui.payments.utils
  (:require [cljs-time.format :as tf]
            [cljs-time.core :as t]
            [clojure.string :refer [lower-case]]))

(def re-email
  (re-pattern
    (str "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]"
         "(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:.[a-zA-Z0-9]"
         "(?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")))

(def date-formatter (tf/formatter "dd.MM.yyyy"))

(def date-time-formatter (tf/formatter "dd.MM.yyyy HH:mm"))

(def today-start (t/today-at 0 0))

(def today-end (t/today-at 23 59 59))

(defn- to-date [d f]
  (when (seq d)
    (when-let [parsed (tf/parse d)]
      (f parsed))))

(defn format-to-simple-date [d]
  (tf/unparse-local date-formatter d))

(defn to-simple-date [d]
  (to-date d format-to-simple-date))

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

(defn not-empty? [v] (seq v))

(defn get-current-year-short []
  "Get current year as a short version (i.e. 17)"
  (mod (.getFullYear (js/Date.)) 100))

(defn parse-int [s]
  "Parse integer from string. If parsing fails (NaN) nil will be returned"
  (let [value (js/parseInt s)] (when-not (js/isNaN value) value)))

(defn assoc-all [c k v] (vec (map #(assoc % k v) c)))

(defn remove-nil [m] (into {} (filter (comp some? val) m)))

(defn find-index-of
  ([col pred i m]
   (when-not (>= i m)
     (if (pred (nth col i))
       i
       (recur col pred (inc i) m))))
  ([col pred]
   (find-index-of col pred 0 (count col))))

(defn valid-email? [v]
  (and
    (not-empty? v)
    (not-nil? (re-matches re-email v))))

(defn is-today? [d]
  (let [date (if (string? d)
               (tf/parse d)
               d)
        today (t/today)]
    (and
      (= (t/day date) (t/day today))
      (= (t/year date) (t/year today))
      (= (t/month date) (t/month today)))))

(defn phase-to-name [phase]
  (str (inc phase) ". erä"))

(defn sort-rows [rows sort-key descend?]
  (if descend?
    (sort-by sort-key rows)
    (reverse (sort-by sort-key rows))))

(defn sort-column! [sort-params sort-key]
  (swap! sort-params assoc
         :sort-key sort-key
         :descend? (not (:descend? @sort-params))))

(defn to-lower-str [v]
  (-> v
      str
      lower-case))

(defn row-matches-key? [row filters]
  (every?
    (fn [[k v]]
      (> (.indexOf (to-lower-str (get row k)) v) -1))
    filters))

(defn filter-rows [rows filters]
  (filter #(row-matches-key? % filters) rows))

(defn update-filters! [filters k v]
  (if (empty? v)
    (swap! filters dissoc k)
    (swap! filters assoc k (lower-case v))))
