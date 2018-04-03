(ns oph.va.admin-ui.user)

(defonce user-info (atom {}))

(defn is-admin? [user]
  (true? (some #(= % "va-admin") (get user :privileges))))
