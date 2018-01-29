(ns oph.va.virkailija.utils
  (:require [clojure.set :refer [rename-keys]]))

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
  (if (contains? m k)
    (update m k f)
    m))
