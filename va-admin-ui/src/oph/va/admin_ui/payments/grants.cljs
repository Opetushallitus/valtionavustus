(ns oph.va.admin-ui.payments.grants
  (:require [clojure.string :refer [lower-case includes?]]
            [cljs-time.format :as f]
            [cljs-time.core :as t]
            [oph.va.admin-ui.payments.utils
             :refer [date-formatter to-simple-date-time]]))

(def ^:private lifetime-limit (t/minus (t/now) (t/months 12)))

(def ^:private status-strs
  {"resolved" "Ratkaistu"
   "published" "Julkaistu"
   "draft" "Luonnos"
   "deleted" "Poistettu"})

(defn flatten-grants [grants]
  (mapv
    #(hash-map
       :id (:id %)
       :register-number (:register-number %)
       :name (get-in % [:content :name :fi])
       :status (get status-strs (:status %))
       :start (to-simple-date-time (get-in % [:content :duration :start]))
       :end (to-simple-date-time (get-in % [:content :duration :end])))
    grants))
