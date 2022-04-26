(ns oph.va.virkailija.excel.all-avustushakus-export
  (:require [dk.ative.docjure.spreadsheet :as spreadsheet])
  (:import [java.io ByteArrayOutputStream]))


(defn export-avustushakus []
  (let [output (ByteArrayOutputStream.)
        wb     (spreadsheet/create-workbook "Avustushaut" [[]])]
    (.write wb output)
    (.toByteArray output)))