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

(defn map-row [translate koulutusosio]
  (let [nameField (:value (first (filter #(= (:fieldType %) "nameField") koulutusosio)))
        applied (traineeCalcObj (:value (first (filter #(= (:fieldType %) "vaTraineeDayCalculator") koulutusosio))))]
    (str "<tr>"
         "<td className='trainingName'>" nameField "</td>"
         "<td className='amount'>" (:scope applied) " " (translate (:scopeType applied)) "</td>"
         "<td className='amount'>'{row.granted.scope} <L translationKey={row.granted.scopeType} /></td>"
         "<td className='amount'>" (:personCount applied) "</td>"
         "<td className='amount'>'{row.granted.personCount}</td>"
         "<td className='amount'>" (:totalFormatted applied) "</td>"
         "<td className='amount'>'{row.granted.totalFormatted}</td>"
         "</tr>")))

(defn koulutusosio [hakemus answers translate language]
  (let [template (email/load-template "templates/koulutusosio.html")
        koulutusosiot (formutil/find-answer-value answers "koulutusosiot")
        overridden-answers (-> hakemus :arvio :overridden-answers :value)
        tbody (str/join " " (map (partial map-row translate) (map :value koulutusosiot)))
        params {:t translate
                :tbody tbody
                }
        body (render template params)]
    body))