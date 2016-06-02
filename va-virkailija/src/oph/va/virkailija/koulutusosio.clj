(ns oph.va.virkailija.koulutusosio
  (:require [clojure.string :as str]
            [clostache.parser :refer [render]]
            [oph.common.email :as email]
            [oph.soresu.form.formutil :as formutil]
            [schema.core :as s]))

(defn findByKeyEnd [list keyEnd]
  (:value (first (filter #(.endsWith (:key %) keyEnd) list))))
;const findByKeyEnd = (list, keyEnd) => _.get(list.find(x => x.key.endsWith(keyEnd)), 'value', '')

(defn formatNumber [num] num)

(defn traineeCalcObj [obj]
  {
   :scope (findByKeyEnd obj ".scope")
   :personCount (findByKeyEnd obj ".person-count")
   :scopeType (findByKeyEnd obj ".scope-type")
   :total (findByKeyEnd obj ".total")
   :totalFormatted (formatNumber (findByKeyEnd obj ".total"))
   })
;      var grantedRowObj = answers.find(answer => answer.key === appliedObj.key).value

(defn map-row [translate answers koulutusosio]
  (let [nameField (:value (first (filter #(= (:fieldType %) "nameField") koulutusosio)))
        applied-obj (first (filter #(= (:fieldType %) "vaTraineeDayCalculator") koulutusosio))
        applied (traineeCalcObj (:value applied-obj))
        applied-key (:key applied-obj)
        granted (traineeCalcObj (:value (first (filter #(= (:key %) applied-key) answers))))]
    (str "<tr>"
         "<td className='trainingName'>" nameField "</td>"
         "<td className='amount'>" (:scope applied) " " (translate (:scopeType applied)) "</td>"
         "<td className='amount'>" (:scope granted) " " (translate (:scopeType granted)) "</td>"
         "<td className='amount'>" (:personCount applied) "</td>"
         "<td className='amount'>" (:personCount granted) "</td>"
         "<td className='amount'>" (:totalFormatted applied) "</td>"
         "<td className='amount'>" (:totalFormatted granted) "</td>"
         "</tr>")))

(defn koulutusosio [hakemus answers translate language]
  (let [template (email/load-template "templates/koulutusosio.html")
        koulutusosiot (formutil/find-answer-value answers "koulutusosiot")
        overridden-answers (-> hakemus :arvio :overridden-answers :value)
        tbody (str/join " " (map (partial map-row translate overridden-answers) (map :value koulutusosiot)))
        params {:t translate
                :tbody tbody
                }
        body (render template params)]
    body))