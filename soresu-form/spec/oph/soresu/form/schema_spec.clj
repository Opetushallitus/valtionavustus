(ns oph.soresu.form.schema-spec
  (:require [speclj.core :refer :all]
            [oph.soresu.form.schema :refer :all]
            [schema.core :as s]))

(describe "form schema"
  (it "validates email address"
    (should-be-nil (s/check Email "first.last@example.com"))
    (should= "(not (\"Email\" \"nosuch\"))" (pr-str (s/check Email "nosuch"))))

  (it "validates Finnish business-id"
    (should-be-nil (s/check FinnishBusinessId "1629284-5"))
    (should= "(not (\"FinnishBusinessId\" \"1629284-6\"))" (pr-str (s/check FinnishBusinessId "1629284-6")))))

(run-specs)
