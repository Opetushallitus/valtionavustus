(ns oph.va.virkailija.invoice
  (:require [clojure.data.xml :refer [element emit emit-str parse]]))

(defn invoice-to-xml [invoice]
  "Creates xml document (tags) of given invoice of Valtionavustukset maksatus.
  Document should be valid document for VIA/Rondo."
  (element invoice))

(defn tags-to-str [tags]
  "Converts XML document of clojure.data.xml.elements tags to a string."
  (emit-str tags))

(defn write-xml! [tags file]
  "Writes XML document to a file.
  Document should be tags as clojure.data.xml.elements."
  (with-open [out-file (java.io.FileWriter. file)]
    (emit tags out-file)))

(defn read-xml [file]
  "Reads XML from file path and returns xml document of
  clojure.data.xml.elements."
  (with-open [input (java.io.FileInputStream. file)]
    (parse input)))


