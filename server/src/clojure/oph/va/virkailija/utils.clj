(ns oph.va.virkailija.utils
  (:require [clojure.set :refer [rename-keys]]
            [clojure.core.async :refer [go timeout chan >! alt!!]]))

(defn- key-contains? [k v]
  (.contains (name k) v))

(defn- replace-in-key [k s d]
  (keyword
   (.replace (name k) s d)))

(defn- map-filter-keys [c f m]
  (reduce
   #(merge %1 {%2 (c %2)}) {} (filter f (keys m))))

(defn- contains-underscore? [k]
  (key-contains? k "_"))

(defn- contains-dash? [k]
  (key-contains? k "-"))

(defn- convert-underscore-keyword [k]
  (replace-in-key k "_" "-"))

(defn- convert-dash-keyword [k]
  (replace-in-key k "-" "_"))

(defn- map-underscore-keys [m]
  (map-filter-keys convert-underscore-keyword contains-underscore? m))

(defn- map-dash-keys [m]
  (map-filter-keys convert-dash-keyword contains-dash? m))

(defn convert-to-dash-keys [m]
  (rename-keys m (map-underscore-keys m)))

(defn convert-to-underscore-keys [m]
  (rename-keys m (map-dash-keys m)))

(defn update-some [m k f]
  (if (some? (get m k))
    (update m k f)
    m))

(defn with-timeout
  "Function for performing task with timeout protection.
  Given function (f) will be called.
  If timeout (t) happens before given function finishes timeout value (tv)
  will be returned."
  [f t tv]
  (let [c (chan)]
    (go
      (>! c (f)))
    (alt!!
      c ([v] v)
      (timeout t) ([_] tv))))

(defn either? [x coll]
  (true? (some #(= % x) coll)))

(defn remove-white-spaces [str]
  (clojure.string/replace str #"\s" ""))
