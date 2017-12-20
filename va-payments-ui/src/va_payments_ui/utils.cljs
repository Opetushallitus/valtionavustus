(ns va-payments-ui.utils
  (:require
   [goog.string :as gstring]
   [goog.string.format]))

(defn not-nil? [v] (not (nil? v)))

(defn any-nil? [m ks]
  (or (not= (count ks) (count (select-keys m ks)))
      (not-every? some? (vals (select-keys m ks)))))

(defn not-empty? [v] (not (empty? v)))

(defn format [fmt & args]
  "Format string"
  (apply gstring/format fmt args))

(defn get-current-year-short []
  "Get current year as a short version (i.e. 17)"
  (mod (.getFullYear (js/Date.)) 100))

(defn parse-int [s]
  "Parse integer from string. If parsing fails (NaN) nil will be returned"
  (let [value (js/parseInt s)]
    (when-not (js/isNaN value) value)))

(defn assoc-all [c k v]
  (into [] (map #(assoc % k v) c)))

(defn assoc-all-when [c k v p?]
  (mapv
   #(if (p? %)
      (assoc % k v)
      %)
   c))

(defn assoc-all-with [c k f a1]
  (mapv #(assoc % k (f % a1)) c))

(defn toggle [c v]
  (if (nil? (get c v))
    (conj c v)
    (disj c v)))

(defn toggle-in
  [c ks]
  (assoc-in c ks (not (get-in c ks))))

(defn remove-nil [m]
  (into {} (filter (comp some? val) m)))
