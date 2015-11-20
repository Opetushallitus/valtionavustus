(ns oph.va.virkailija.export
  (:use [clojure.tools.trace :only [trace]])
  (:require [clojure.java.io :as io]
            [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.virkailija.hakudata :as hakudata])
  (:import [java.io ByteArrayOutputStream ByteArrayInputStream]))

(def main-sheet-name "Hakemukset")
(def main-sheet-columns ["Diaarinumero"
                         "Hakijaorganisaatio"
                         "Hankkeen nimi"
                         "Ehdotettu budjetti"
                         "OPH:n avustuksen osuus"
                         "Myönnetty avustus"
                         "Arviokeskiarvo"])

(def answers-sheet-name "Vastaukset")

(def answers-fixed-fields
  [["fixed-register-number" "Diaarinumero" :register-number]
   ["fixed-organization-name" "Hakijaorganisaatio" :organization-name]
   ["fixed-project-name" "Projektin nimi" :project-name]
   ["fixed-budget-total" "Ehdotettu budjetti" :budget-total]
   ["fixed-budget-oph-share" "OPH:n avustuksen osuus" :budget-oph-share]
   ["fixed-budget-granted" "Myönnetty avustus" (comp :budget-granted :arvio)]
   ["fixed-score-total-average" "Arviokeskiarvo" (comp :score-total-average :scoring :arvio)]])

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
  (or (= (:status hakemus) "submitted")
      (= (:status hakemus) "pending_change_request")))

(defn- avustushaku->formlabels [avustushaku]
  (let [form (-> avustushaku :form :content)
        wrappers (formutil/find-wrapper-elements form)]
    (->> form
         (formutil/find-fields)
         (map (fn [field] [(:id field) (or (-> field :label :fi)
                                           (find-parent-label wrappers (:id field)))])))))

(defn- avustushaku->hakemukset [avustushaku]
  (->> (:hakemukset avustushaku)
       (filter valid-hakemus?)))

(defn- hakemus->map [hakemus]
  (let [answers (formutil/unwrap-answers (:answers hakemus))]
    (reduce (fn [answer-map [field-name _ lookup-fn]]
              (assoc answer-map field-name (lookup-fn hakemus)))
            answers
            answers-fixed-fields)))

(defn flatten-answers [avustushaku answer-keys answer-labels]
  (let [hakemukset (avustushaku->hakemukset avustushaku)
        answers (map hakemus->map hakemukset)
        flat-answers (map (fn [answer-set]
                            (map (fn [id]
                                   (get answer-set id)) answer-keys))
                          answers)]
    (apply conj [answer-labels] flat-answers)))

(def hakemus->main-sheet-rows
  (juxt :register-number
        :organization-name
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

        answer-key-label-pairs (avustushaku->formlabels avustushaku)
        answer-keys (apply conj
                           (mapv first answers-fixed-fields)
                           (map first answer-key-label-pairs))
        answer-labels (apply conj
                             (mapv second answers-fixed-fields)
                             (map second answer-key-label-pairs))
        answer-flatdata (flatten-answers avustushaku answer-keys answer-labels)
        answers-sheet (let [sheet (spreadsheet/add-sheet! wb answers-sheet-name)]
                        (spreadsheet/add-rows! sheet answer-flatdata)
                        sheet)
        answers-header-row (first (spreadsheet/row-seq answers-sheet))

        header-style (spreadsheet/create-cell-style! wb {:background :yellow
                                                         :font {:bold true}})]

    (fit-columns main-sheet-columns main-sheet)
    (fit-columns answer-keys answers-sheet)

    ;; Style first row
    (spreadsheet/set-row-style! main-header-row header-style)
    (spreadsheet/set-row-style! answers-header-row header-style)

    (.write wb output)
    (ByteArrayInputStream. (.toByteArray output))))
