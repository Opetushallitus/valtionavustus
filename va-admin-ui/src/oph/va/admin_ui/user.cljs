(ns oph.va.admin-ui.user)

(defn is-admin? [user]
  (not (nil? (some #(= % "va-admin") (get user :privileges)))))
