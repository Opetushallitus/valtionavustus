(ns oph.va.virkailija.scheduler-spec
  (:require [speclj.core
            :refer [should-throw should= describe
                    it tags run-specs]]
            [oph.va.virkailija.scheduler :as s]))

(describe
  "Scheduler"

  (tags :scheduler)

  (it "calculates time unit conversions"
      (should= 100 (s/to-ms 100 :millisecond))
      (should= 50000 (s/to-ms 50 :second))
      (should= 1200000 (s/to-ms 20 :minute))
      (should= 7200000 (s/to-ms 2 :hour))
      (should-throw Exception
                   (s/to-ms 2 :day))))

(run-specs)
