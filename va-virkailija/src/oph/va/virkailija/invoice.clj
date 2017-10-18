(ns oph.va.virkailija.invoice
  (:require [clojure.data.xml :as xml]))

(defn write-xml! [tags file]
  (with-open [out-file (java.io.FileWriter. file)]
    (xml/emit tags out-file)))

(defn read-xml [file]
  (with-open [input (java.io.FileInputStream. file)]
    (xml/parse input)))

(defn is-valid? [tags]
  false)
