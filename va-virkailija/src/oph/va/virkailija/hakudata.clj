(ns ^{:skip-aot true} oph.va.virkailija.hakudata
  (:use [clojure.tools.trace :only [trace]])
  (:require [oph.va.virkailija.db :as virkailija-db]
            [oph.va.virkailija.scoring :as scoring]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.virkailija.auth :as auth]))

(defn arvio-json [arvio]
  {:id (:id arvio)
   :status (:status arvio)
   :budget-granted (:budget_granted arvio)
   :summary-comment (:summary_comment arvio)})

(defn- add-arvio [arviot hakemus]
  (if-let [arvio (get arviot (:id hakemus))]
    (assoc hakemus :arvio arvio)
    (assoc hakemus :arvio {:id -1
                           :status "unhandled"
                           :budget-granted 0})))

(defn- get-arviot-map [hakemukset]
  (->> hakemukset
       (map :id)
       (virkailija-db/get-arviot)
       (map (fn [arvio] [(:hakemus_id arvio) (arvio-json arvio)]))
       (into {})))

(defn- add-arviot [haku-data]
  (let [hakemukset (:hakemukset haku-data)
        arviot (get-arviot-map hakemukset)
        budget-granted-sum (reduce + (map :budget-granted (vals arviot)))]
    (-> haku-data
        (assoc :hakemukset (map (partial add-arvio arviot) hakemukset))
        (assoc :budget-granted-sum budget-granted-sum))))

(defn- add-scores-to-hakemus [scores hakemus]
  (if-let [hakemus-scores (-> (fn [score-entry] (= (-> hakemus :arvio :id) (:arvio-id score-entry)))
                              (filter scores)
                              first)]
    (assoc-in hakemus [:arvio :scoring] hakemus-scores)
    hakemus))

(defn- add-scores [scores haku-data]
  (let [hakemukset (:hakemukset haku-data)]
    (-> haku-data
        (assoc :hakemukset (map (partial add-scores-to-hakemus scores) hakemukset)))))

(defn- add-privileges [identity haku-data]
  (-> haku-data (assoc :privileges (auth/resolve-privileges identity haku-data))))

(defn get-combined-avustushaku-data [avustushaku-id identity]
  (let [scores (scoring/get-avustushaku-scores avustushaku-id)]
    (when-let [avustushaku (hakija-api/get-hakudata avustushaku-id)]
      (->> avustushaku
           add-arviot
           (add-scores scores)
           (add-privileges identity)))))
