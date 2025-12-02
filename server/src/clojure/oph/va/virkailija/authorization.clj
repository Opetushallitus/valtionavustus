(ns oph.va.virkailija.authorization)

(defn is-pääkäyttäjä? [identity]
  (some? (some #{"va-admin"} (:privileges identity))))

(defn is-valmistelija? [{:keys [role]}]
  (or
   (= role "presenting_officer")
   (= role "vastuuvalmistelija")))

(defn resolve-user-privileges [user-identity user-haku-role]
  (let [is-presenter      (is-valmistelija? user-haku-role)
        is-evaluator      (= "evaluator" (:role user-haku-role))
        is-va-admin       (is-pääkäyttäjä? user-identity)]
    {:edit-haku            (or is-presenter is-va-admin)
     :edit-my-haku-role    is-va-admin
     :score-hakemus        (or is-presenter is-evaluator)
     :change-hakemus-state is-presenter}))
