(ns oph.va.virkailija.lkp-templates)

(def templates (atom []))

(defn set-templates! [v] (reset! templates v))

(defn get-matching-account [{:keys [key value]}]
  (some
    (fn [t]
      (when (= (:key t) key)
        (get-in t [:accounts value])))
    @templates))

(defn get-lkp-account [answers]
  (some get-matching-account answers))
