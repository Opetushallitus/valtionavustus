(ns oph.va.virkailija.export
  (:use [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.va.virkailija.hakudata :as hakudata])
  (:import [java.io ByteArrayOutputStream ByteArrayInputStream]))

(def main-sheet-name "Hakemukset")
(def main-sheet-columns ["Hakijaorganisaatio"
                         "Diaarinumero"
                         "Hankkeen nimi"
                         "Ehdotettu budjetti"
                         "OPH:n avustuksen osuus"])

(defn- valid-hakemus? [hakemus]
  (= (:status hakemus) "submitted"))

(defn- hakemus->main-sheet-rows [hakemus]
  [(:organization-name hakemus)
   (:register-number hakemus)
   (:project-name hakemus)
   (:budget-total hakemus)
   (:budget-oph-share hakemus)])

(defn export-avustushaku [avustushaku-id]
  (let [avustushaku (hakudata/get-combined-avustushaku-data avustushaku-id)
        output (ByteArrayOutputStream.)
        rows (->> (:hakemukset avustushaku)
                  (filter valid-hakemus?)
                  (mapv hakemus->main-sheet-rows))
        wb (spreadsheet/create-workbook main-sheet-name
                                        (apply conj [main-sheet-columns] rows))
        main-sheet (spreadsheet/select-sheet main-sheet-name wb)]
    ;; Make columns fit the data
    (doseq [index (range 0 (count main-sheet-columns))]
      (.autoSizeColumn main-sheet index))
    (.write wb output)
    (ByteArrayInputStream. (.toByteArray output))))
