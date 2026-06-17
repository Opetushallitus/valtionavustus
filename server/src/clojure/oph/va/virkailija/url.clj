(ns oph.va.virkailija.url
  (:import [java.net URLEncoder]))

(defn encode [s]
  (URLEncoder/encode (str s) "UTF-8"))
