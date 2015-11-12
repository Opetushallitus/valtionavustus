(ns oph.va.virkailija.export
  (:use [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.va.virkailija.handlers :as handlers])
  (:import [java.io ByteArrayOutputStream ByteArrayInputStream]))

(defn export-avustushaku [avustushaku-id]
  (let [avustushaku (handlers/get-combined-avustushaku-data avustushaku-id)
        output (ByteArrayOutputStream.)
        rows (->> (:hakemukset avustushaku)
                  (mapv (fn [hakemus]
                          [(:organization-name hakemus) (:project-name hakemus)])))
        wb (spreadsheet/create-workbook "Avustushaut"
                                        (trace (apply conj [["Hakijaorganisaatio" "Hankkeen nimi"]] rows)))]
    (.write wb output)
    (ByteArrayInputStream. (.toByteArray output))))
