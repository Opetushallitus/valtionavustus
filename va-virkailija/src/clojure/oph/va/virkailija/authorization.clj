(ns oph.va.virkailija.authorization)

(defn resolve-user-privileges [user-identity user-haku-role]
  (let [is-presenter      (= "presenting_officer" (:role user-haku-role))
        is-evaluator      (= "evaluator" (:role user-haku-role))
        is-va-admin       (some? (some #{"va-admin"} (:privileges user-identity)))]
    {:edit-haku            (or is-presenter is-va-admin)
     :edit-my-haku-role    is-va-admin
     :score-hakemus        (or is-presenter is-evaluator)
     :change-hakemus-state is-presenter}))
