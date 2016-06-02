(ns oph.va.virkailija.koulutusosio
  (:require [clojure.string :as str]
            [clostache.parser :refer [render]]
            [oph.common.email :as email]
            [oph.soresu.form.formutil :as formutil]
            [schema.core :as s]))

(defn find-by-key-end [list keyEnd]
  (:value (first (filter #(.endsWith (:key %) keyEnd) list))))


(defn format-number [number]
  (let [s (str number)
        grouped (clojure.string/replace s #"(\d)(?=(\d{3})+(?!\d))" "$1\u00A0")]
    (str/replace grouped #"[,.]0" "")))

(defn koulutusosio-row-part [obj]
  {:scope (find-by-key-end obj ".scope")
   :person-count (find-by-key-end obj ".person-count")
   :scope-type (find-by-key-end obj ".scope-type")
   :total (find-by-key-end obj ".total")
   :total-formatted (format-number (find-by-key-end obj ".total"))})

(defn map-tr [translate koulutusosio-data]
  (let [nameField (:name koulutusosio-data)
        applied (:applied koulutusosio-data)
        granted (:granted koulutusosio-data)]
    (str "<tr>"
         "<td class='trainingName'>" nameField "</td>"
         "<td class='amount'>" (:scope applied) " " (translate (:scope-type applied)) "</td>"
         "<td class='amount'>" (:scope granted) " " (translate (:scope-type granted)) "</td>"
         "<td class='amount'>" (:person-count applied) "</td>"
         "<td class='amount'>" (:person-count granted) "</td>"
         "<td class='amount'>" (:total-formatted applied) "</td>"
         "<td class='amount'>" (:total-formatted granted) "</td>"
         "</tr>")))

(defn map-row-data [answers koulutusosio]
  (let [nameField (:value (first (filter #(= (:fieldType %) "nameField") koulutusosio)))
        applied-obj (first (filter #(= (:fieldType %) "vaTraineeDayCalculator") koulutusosio))
        applied (koulutusosio-row-part (:value applied-obj))
        applied-key (:key applied-obj)
        granted (koulutusosio-row-part (:value (first (filter #(= (:key %) applied-key) answers))))]
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
                :total-granted total-granted}
        body (render template params)]
    body))