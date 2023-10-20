(ns oph.va.menoluokka.db
  (:use [oph.soresu.common.db]
        [clojure.data :as data]
        [clojure.tools.trace :only [trace]])
  (:require [oph.soresu.form.formutil :as formutil])
  (:import [java.util Date]))

(defn- remove-whitespace [input]
  (clojure.string/replace input #"\s" ""))

(defn- answer->menoluokka-row [answers hakemus-id menoluokka]
  {:menoluokka_id (:id menoluokka)
   :hakemus_id hakemus-id
   :amount (Integer/parseInt (remove-whitespace (formutil/find-answer-value answers (str (:type menoluokka) ".amount"))))})

(defn store-menoluokka-hakemus-rows [avustushaku-id hakemus-id answers]
  (with-tx (fn [tx]
             (let [menoluokka-types (query tx "SELECT id, type FROM virkailija.menoluokka WHERE avustushaku_id = ?" [avustushaku-id])
                   menoluokka-rows (map (partial answer->menoluokka-row answers hakemus-id) menoluokka-types)]
               (doseq [menoluokka menoluokka-rows]
                 (execute! tx
                           "INSERT INTO virkailija.menoluokka_hakemus (menoluokka_id, hakemus_id, amount)
                            VALUES (?, ?, ?)
                            ON CONFLICT (hakemus_id, menoluokka_id) DO UPDATE SET
                              amount = EXCLUDED.amount"
                           [(:menoluokka_id menoluokka) (:hakemus_id menoluokka) (:amount menoluokka)]))))))

(defn- upsert-menoluokka [tx application-id menoluokka]
  (let [id-rows (query tx
              "INSERT INTO virkailija.menoluokka (avustushaku_id, type, translation_fi, translation_sv)
              VALUES (?, ?, ?, ?)
              ON CONFLICT (avustushaku_id, type) DO UPDATE SET
                translation_fi = EXCLUDED.translation_fi,
                translation_sv = EXCLUDED.translation_sv
              RETURNING id"
              [application-id (:type menoluokka) (:translation_fi menoluokka) (:translation_sv menoluokka)])]
    (:id (first id-rows))))

(defn- budget->menoluokka [budget-elem]
  {:type (:id budget-elem)
   :translation_fi (:fi (:label budget-elem))
   :translation_sv (:sv (:label budget-elem))})

(defn- form->menoluokka [form]
  (let [content         (:content form)
        plan            (if content (first (filter #(when (= (:id %) "financing-plan") %) content)))
        budget          (if (:children plan) (first (filter #(when (= (:id %) "budget") %) (:children plan))))
        project-budget  (if (:children budget) (first (filter #(when (= (:id %) "project-budget") %) (:children budget))))
        menoluokka-rows (if (:children project-budget) (map budget->menoluokka (:children project-budget)))]
    menoluokka-rows))

(defn- parameter-list [list]
  (clojure.string/join ", " (take (count list) (repeat "?"))))

(defn- remove-old-menoluokka-rows [tx application-id current-menoluokka-ids]
  (execute! tx
    (str "DELETE FROM virkailija.menoluokka WHERE avustushaku_id = ? AND id NOT IN (" (parameter-list current-menoluokka-ids) ")")
    (conj current-menoluokka-ids application-id)))

(defn- remove-menoluokka-rows [tx application-id]
  (execute! tx
            "DELETE FROM virkailija.menoluokka WHERE avustushaku_id = ?"
            [application-id]))

(defn upsert-menoluokka-rows [tx application-id form]
  (if-let [menoluokka-rows (form->menoluokka form)]
    (let [current-menoluokka-ids (map (partial upsert-menoluokka tx application-id) menoluokka-rows)]
        (remove-old-menoluokka-rows tx application-id current-menoluokka-ids))
    (remove-menoluokka-rows tx application-id)))

