(ns oph.va.virkailija.export
  (:use [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.soresu.form.formutil :as formutil]
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

(defn- has-child? [id node]
  (when-let [children (:children node)]
    (let [child-list (->> children
                          (filter (fn [child] (= (:id child) id))))]
      (when (not (empty? child-list))
        node))))

(defn- find-parent-label [wrappers id]
  (when-let [found-parent (->> wrappers
                               (filter (partial has-child? id))
                               first)]
    (-> found-parent :label :fi)))

(defn- valid-hakemus? [hakemus]
  (= (:status hakemus) "submitted"))

(defn- avustushaku->formlabels [avustushaku]
  (let [form (-> avustushaku :form :content)
        wrappers (formutil/find-wrapper-elements form)]
    (->> form
         (formutil/find-fields)
         (map (fn [field] [(:id field) (or (-> field :label :fi)
                                           (find-parent-label wrappers (:id field)))]))
         (into {}))))

(defn- avustushaku->hakemukset [avustushaku]
  (->> (:hakemukset avustushaku)
       (filter valid-hakemus?)))

(defn flatten-answers [avustushaku label-map]
  (let [hakemukset (avustushaku->hakemukset avustushaku)
        answers (map (comp formutil/unwrap-answers :answers) hakemukset)
        flat-answers (map (fn [answer-set]
                            (map (fn [formid]
                                   (let [[id header] formid]
                                     (get answer-set id))) label-map)) answers)]
    (apply conj [(vals label-map)] flat-answers)))

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

(defn export-avustushaku [avustushaku-id identity]
  (let [avustushaku (hakudata/get-combined-avustushaku-data avustushaku-id identity)
        hakemus-list (avustushaku->hakemukset avustushaku)
        output (ByteArrayOutputStream.)
        main-sheet-rows (mapv hakemus->main-sheet-rows hakemus-list)
        wb (spreadsheet/create-workbook main-sheet-name
                                        (apply conj [main-sheet-columns] main-sheet-rows))

        main-sheet (spreadsheet/select-sheet main-sheet-name wb)
        main-header-row (first (spreadsheet/row-seq main-sheet))

        answer-label-map (avustushaku->formlabels avustushaku)
        answer-flatdata (flatten-answers avustushaku answer-label-map)
        answers-sheet (let [sheet (spreadsheet/add-sheet! wb answers-sheet-name)]
                        (spreadsheet/add-rows! sheet answer-flatdata)
                        sheet)
        answers-header-row (first (spreadsheet/row-seq answers-sheet))

        header-style (spreadsheet/create-cell-style! wb {:background :yellow
                                                         :font {:bold true}})]

    (fit-columns main-sheet-columns main-sheet)
    (fit-columns (vals answer-label-map) answers-sheet)

    ;; Style first row
    (spreadsheet/set-row-style! main-header-row header-style)
    (spreadsheet/set-row-style! answers-header-row header-style)

    (.write wb output)
    (ByteArrayInputStream. (.toByteArray output))))
