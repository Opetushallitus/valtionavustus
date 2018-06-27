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

(defn- parse-date [s]
  (when (seq s)
    (f/parse date-formatter s)))

(defn- convert-grant-dates [grant]
  (update grant :loppuselvitysdate parse-date))

(defn convert-dates [grants]
  (mapv convert-grant-dates grants))

(defn grant-matches? [g s]
  (if (empty? s)
    true
    (let [s-lower (lower-case s)]
      (or (includes? (:register-number g) s-lower)
          (includes? (lower-case (get-in g [:content :name :fi])) s-lower)))))

(defn flatten-grants [grants]
  (mapv
    #(hash-map
       :register-number (:register-number %)
       :name (get-in % [:content :name :fi])
       :status (get status-strs (:status %))
       :start (to-simple-date-time (get-in % [:content :duration :start]))
       :end (to-simple-date-time (get-in % [:content :duration :end])))
    grants))
