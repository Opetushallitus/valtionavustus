(ns oph.va.virkailija.koulutusosio
  (:require [clojure.string :as str]
            [clostache.parser :refer [render]]
            [oph.common.email :as email]
            [oph.soresu.form.formutil :as formutil]
            [schema.core :as s]))

(defn findByKeyEnd [list keyEnd]
  (:value (first (filter #(.endsWith (:key %) keyEnd) list))))


(defn format-number [number]
  (let [s (str number)
        grouped  (clojure.string/replace s #"(\d)(?=(\d{3})+(?!\d))" "$1\u00A0")]
    (str/replace grouped #"[,.]0" "")))

(defn traineeCalcObj [obj]
  {:scope (findByKeyEnd obj ".scope")
   :personCount (findByKeyEnd obj ".person-count")
   :scopeType (findByKeyEnd obj ".scope-type")
   :total (findByKeyEnd obj ".total")
   :totalFormatted (format-number (findByKeyEnd obj ".total"))})

(defn map-tr [translate koulutusosio-data]
  (let [nameField (:name koulutusosio-data)
        applied (:applied koulutusosio-data)
        granted (:granted koulutusosio-data)]
    (str "<tr>"
         "<td class='trainingName'>" nameField "</td>"
         "<td class='amount'>" (:scope applied) " " (translate (:scopeType applied)) "</td>"
         "<td class='amount'>" (:scope granted) " " (translate (:scopeType granted)) "</td>"
         "<td class='amount'>" (:personCount applied) "</td>"
         "<td class='amount'>" (:personCount granted) "</td>"
         "<td class='amount'>" (:totalFormatted applied) "</td>"
         "<td class='amount'>" (:totalFormatted granted) "</td>"
         "</tr>")))

(defn map-row-data [answers koulutusosio]
  (let [nameField (:value (first (filter #(= (:fieldType %) "nameField") koulutusosio)))
        applied-obj (first (filter #(= (:fieldType %) "vaTraineeDayCalculator") koulutusosio))
        applied (traineeCalcObj (:value applied-obj))
        applied-key (:key applied-obj)
        granted (traineeCalcObj (:value (first (filter #(= (:key %) applied-key) answers))))]
    {:name nameField
     :applied applied
     :granted granted}))

(defn calculate-total [key list]
  (format-number (reduce + (map (comp bigdec #(str/replace % "," ".") :total key) list))))

(defn koulutusosio [hakemus answers translate language]
  (let [template (email/load-template "templates/koulutusosio.html")
        koulutusosiot (map :value (formutil/find-answer-value answers "koulutusosiot"))
        overridden-answers (-> hakemus :arvio :overridden-answers :value)
        koulutusosiot-data (map (partial map-row-data overridden-answers) koulutusosiot)
        total-applied (calculate-total :applied koulutusosiot-data)
        total-granted (calculate-total :granted koulutusosiot-data)
        tbody (str/join " " (map (partial map-tr translate) koulutusosiot-data))
        params {:t translate
                :tbody tbody
                :total-applied total-applied
                :total-granted total-granted
                }
        body (render template params)]
    body))