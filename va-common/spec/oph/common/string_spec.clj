(ns oph.common.string-spec
  (:require [speclj.core :refer :all]
            [oph.common.string :as common-string]))

(describe "Common string tools"
  (it "trims or returns nil"
      (should-be-nil (common-string/trimmed-or-nil nil))
      (should-be-nil (common-string/trimmed-or-nil ""))
      (should-be-nil (common-string/trimmed-or-nil " "))
      (should= "a" (common-string/trimmed-or-nil "a"))
      (should= "a" (common-string/trimmed-or-nil " a\t\n")))

  (it "trims whitespace"
      (should= "foo" (common-string/trim-ws " \n\tfoo\n \r"))
      (should= "foo   bar" (common-string/trim-ws " \n\tfoo\n \rbar \n"))))

(run-specs)
