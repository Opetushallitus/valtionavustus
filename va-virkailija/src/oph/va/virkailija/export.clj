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
                         "OPH:n avustuksen osuus"
                         "Myönnetty avustus"
                         "Arviokeskiarvo"])

(def answers-sheet-name "Vastaukset")
(def answers-sheet-columns ["Hakijaorganisaatio"
                            "Diaarinumero"
                            "Hankkeen nimi"
                            "Ehdotettu budjetti"
                            "OPH:n avustuksen osuus"])

(defn- valid-hakemus? [hakemus]
  (= (:status hakemus) "submitted"))

(def hakemus->main-sheet-rows
  (juxt :organization-name
        :register-number
        :project-name
        :budget-total
        :budget-oph-share
        (comp :budget-granted :arvio)
        (comp :score-total-average :scoring :arvio)))

(defn- fit-columns [columns sheet]
  ;; Make columns fit the data
  (doseq [index (range 0 (count columns))]
    (.autoSizeColumn sheet index)))

(defn export-avustushaku [avustushaku-id]
  (let [avustushaku (hakudata/get-combined-avustushaku-data avustushaku-id)
        hakemus-list (->> (:hakemukset avustushaku)
                          (filter valid-hakemus?))
        output (ByteArrayOutputStream.)
        main-sheet-rows (mapv hakemus->main-sheet-rows hakemus-list)
        wb (spreadsheet/create-workbook main-sheet-name
                                        (apply conj [main-sheet-columns] main-sheet-rows))

        main-sheet (spreadsheet/select-sheet main-sheet-name wb)
        main-header-row (first (spreadsheet/row-seq main-sheet))

        answers-sheet (let [sheet (spreadsheet/add-sheet! wb answers-sheet-name)]
                        (spreadsheet/add-row! sheet answers-sheet-columns)
                        sheet)
        answers-header-row (first (spreadsheet/row-seq answers-sheet))

        header-style (spreadsheet/create-cell-style! wb {:background :yellow
                                                         :font {:bold true}})]

    (fit-columns main-sheet-columns main-sheet)
    (fit-columns answers-sheet-columns answers-sheet)

    ;; Style first row
    (spreadsheet/set-row-style! main-header-row header-style)
    (spreadsheet/set-row-style! answers-header-row header-style)

    (.write wb output)
    (ByteArrayInputStream. (.toByteArray output))))
