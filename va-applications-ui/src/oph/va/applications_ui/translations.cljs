(ns oph.va.applications-ui.translations)

(def strings
  {:project {:en "Project" :fi "Projekti"}})

(def fallback-lng :en)

(defn get-translation [item lng]
  (get-in strings [item lng]
          (when (not= lng fallback-lng) (get-translation item fallback-lng))))
