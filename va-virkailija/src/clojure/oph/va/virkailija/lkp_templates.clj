(ns oph.va.virkailija.lkp-templates
  (:require [clojure.java.io :as io]))

(def built-in-templates ["lkp-templates/ownership_type.edn"
                         "lkp-templates/radio_button_0.edn"])

(def file-filter
  (reify
    java.io.FilenameFilter
    (accept [_ _ filename]
      (.endsWith filename ".edn"))))

(defn load-templates [files]
  (map #(-> % slurp read-string) files))

(defn list-custom-templates [path]
  (let [dir (io/file path)]
    (if (.exists dir)
      (.listFiles (io/file path) file-filter)
      [])))

(def system-templates
  (into (load-templates (map io/resource built-in-templates))
        (load-templates (list-custom-templates "lkp-templates"))))

(defn create-account-matcher [templates]
  (fn [{:keys [key value]}]
    (some
      (fn [t]
        (when (= (:key t) key)
          (get-in t [:accounts value])))
      templates)))

(defn get-lkp-account
  ([templates answers] (some (create-account-matcher templates) answers))
  ([answers] (get-lkp-account system-templates answers)))
