(ns oph.va.admin-ui.user)

(defonce user-info (atom {}))

(defn is-admin? [user]
  (not (nil? (some #(= % "va-admin") (get user :privileges)))))
