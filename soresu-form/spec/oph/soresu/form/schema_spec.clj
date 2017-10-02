(ns oph.soresu.form.schema-spec
  (:require [speclj.core :refer :all]
            [oph.soresu.form.schema :refer :all]
            [schema.core :as s])

  (:import [oph.soresu.form.schema EmailSchema]))

(describe "form schema"
  (it "validates email"
    (should-be-nil (s/check Email "user@example.com"))
    (should-be-nil (s/check Email "first.last@example.com"))
    (should= "(not (\"Email\" \"nosuch\"))" (pr-str (s/check Email "nosuch")))
    (should= "(not (\"Email\" \"user@example.com;\"))" (pr-str (s/check Email "user@example.com;")))
    (should= "(not (\"Email\" \"u@ex.com; v@ex.com\"))" (pr-str (s/check Email "u@ex.com; v@ex.com")))
    (should= "(not (\"Email\" 42))" (pr-str (s/check Email 42)))
    (should= "(not (\"Email\" nil))" (pr-str (s/check Email nil)))))

(run-specs)
