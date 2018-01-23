(ns oph.va.virkailija.lkp-templates)

(def templates (map #(-> % slurp read-string)
                    (.listFiles (io/file (io/resource "lkp-templates")))))

(defn get-matching-account [{:keys [key value]}]
  (some
    (fn [t]
      (when (= (:key t) key)
        (get-in t [:accounts value])))
    @templates))

(defn get-lkp-account [answers]
  (some get-matching-account answers))
