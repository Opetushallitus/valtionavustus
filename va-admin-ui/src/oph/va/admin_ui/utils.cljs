(ns oph.va.admin-ui.utils)

(defn parse-int
  ([s d]
   (let [parsed (js/parseInt s)]
     (if (js/isNaN parsed) d parsed)))
  ([s] (parse-int s nil)))
