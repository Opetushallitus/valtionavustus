(ns oph.va.virkailija.url
  (:require [clojure.string :as string])
  (:import [java.net URLEncoder]))

(defn encode [s]
  (URLEncoder/encode (str s) "UTF-8"))

(defn encode-map->query [m]
  (string/join "&"
               (map (fn [[k v]] (str (name k) "=" (encode v)))
                    m)))
