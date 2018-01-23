(ns oph.va.virkailija.lkp-templates
  (require [clojure.java.io :as io]))

(def file-filter
  (reify
    java.io.FilenameFilter
    (accept [this _ filename]
      (.endsWith filename ".edn"))))

(def system-templates
  (map #(-> % slurp read-string)
       (.listFiles (io/file (io/resource "lkp-templates")) file-filter)))

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
