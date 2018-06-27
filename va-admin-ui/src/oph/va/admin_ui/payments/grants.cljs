(ns oph.va.admin-ui.payments.grants
  (:require [cljs-time.format :as f]))

(def ^:private status-strs
  {"resolved" "Ratkaistu"
   "published" "Julkaistu"
   "draft" "Luonnos"
   "deleted" "Poistettu"})

(defn- parse-date [s]
  (if (seq s)
    (f/parse s)
    s))

(defn flatten-grants [grants]
  (mapv
    #(hash-map
       :id (:id %)
       :register-number (:register-number %)
       :name (get-in % [:content :name :fi])
       :status (get status-strs (:status %))
       :start (parse-date (get-in % [:content :duration :start]))
       :end (parse-date (get-in % [:content :duration :end])))
    grants))
