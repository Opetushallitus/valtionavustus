(ns oph.common.string-spec
  (:require [speclj.core :refer :all]
            [oph.common.string :as common-string]))

(describe "Common string tools"
  (it "trims whitespace"
      (should= "foo" (common-string/trim-ws " \n\tfoo\n \r"))
      (should= "foo   bar" (common-string/trim-ws " \n\tfoo\n \rbar \n"))))

(run-specs)
