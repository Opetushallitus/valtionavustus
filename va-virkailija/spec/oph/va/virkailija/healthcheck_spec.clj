(ns oph.va.virkailija.healthcheck-spec
  (:require [speclj.core
<<<<<<< HEAD
            :refer [should-throw should should-not describe
=======
            :refer [should-throw should describe
>>>>>>> 860f9eb6b735c7589fa0ee9444112cbc94bbf606
                    it tags run-specs]]
            [oph.va.virkailija.healthcheck :as h]
            [clj-time.core :as t]))

(describe
  "Healtcheck"

  (tags :healthcheck)

  (it "checks validate-checks function"
<<<<<<< HEAD
      (should-not
        (:valid (first (h/validate-checks
                         [{:timestamp (t/minus (t/now) (t/minutes 20))}] 15))))
=======
      (prn (h/validate-checks [{:timestamp (t/now)}] 15))
>>>>>>> 860f9eb6b735c7589fa0ee9444112cbc94bbf606
      (should
        (:valid (first (h/validate-checks [{:timestamp (t/now)}] 15))))))

(run-specs)
