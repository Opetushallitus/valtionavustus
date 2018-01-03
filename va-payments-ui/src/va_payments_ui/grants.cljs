(ns va-payments-ui.grants
  (:require [clojure.string :refer [lower-case includes?]]
            [cljs-time.format :as f]
            [cljs-time.core :as t]
            [va-payments-ui.utils :refer [update-all]]))

(defn remove-old
  [grants]
  (filterv #(and (= (:status %) "resolved")
                 (or (nil? (:loppuselvitysdate %))
                     (t/after? (:loppuselvitysdate %)
                               (t/minus (t/today) (t/months 12)))))
    grants))

(defn convert-dates
  [grants]
  (update-all grants
              [:valiselvitysdate :loppuselvitysdate :created-at
               [:content :duration :end] [:content :duration :start]]
              f/parse))

(defn grant-matches?
  [g s]
  (if (empty? s)
    true
    (let [s-lower (lower-case s)]
      (or (includes? (:register-number g) s-lower)
          (includes? (lower-case (get-in g [:content :name :fi])) s-lower)))))
