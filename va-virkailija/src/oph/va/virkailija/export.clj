(ns oph.va.virkailija.export
  (:use [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.va.virkailija.handlers :as handlers])
  (:import [java.io ByteArrayOutputStream ByteArrayInputStream]))

(def main-sheet-columns ["Hakijaorganisaatio"
                         "Diaarinumero"
                         "Hankkeen nimi"
                         "Ehdotettu budjetti"
                         "OPH:n avustuksen osuus"])

(defn export-avustushaku [avustushaku-id]
  (let [avustushaku (handlers/get-combined-avustushaku-data avustushaku-id)
        output (ByteArrayOutputStream.)
        rows (->> (:hakemukset avustushaku)
                  (filter (fn [hakemus] (= (:status hakemus) "submitted")))
                  (mapv (fn [hakemus]
                          [(:organization-name hakemus)
                           (:register-number hakemus)
                           (:project-name hakemus)
                           (:budget-total hakemus)
                           (:budget-oph-share hakemus)])))
        wb (spreadsheet/create-workbook "Hakemukset"
                                        (apply conj [main-sheet-columns] rows))
        main-sheet (spreadsheet/select-sheet "Hakemukset" wb)]
    (doseq [index (range 0 (count main-sheet-columns))]
      (.autoSizeColumn main-sheet index))
    (.write wb output)
    (ByteArrayInputStream. (.toByteArray output))))
