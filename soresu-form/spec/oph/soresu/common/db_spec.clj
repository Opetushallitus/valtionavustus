(ns oph.soresu.common.db-spec
  (:require [speclj.core :refer :all]
            [oph.soresu.common.db :refer :all]))

(describe "db"
          (it "escapes pattern for SQL like expression"
              (should= "\\%" (escape-like-pattern "%"))
              (should= "\\_" (escape-like-pattern "_"))
              (should= "\\\\" (escape-like-pattern "\\"))
              (should= "a \\\\ b \\%-c \\_ d" (escape-like-pattern "a \\ b %-c _ d"))))

(run-specs)
