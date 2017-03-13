(ns oph.va.hakija.domain)

(defn- unique-nonempty-values [values]
  (->> values
       distinct
       (filter not-empty)))

(defn- cleanup-avustushaku-rahoitusalueet [rahoitusalueet]
  (map #(update % :talousarviotilit unique-nonempty-values) rahoitusalueet))

(defn cleanup-avustushaku-content [avustushaku-content]
  (assoc avustushaku-content
         :rahoitusalueet (cleanup-avustushaku-rahoitusalueet (:rahoitusalueet avustushaku-content))))
