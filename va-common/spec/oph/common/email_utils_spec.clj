(ns oph.common.email-utils-spec
  (:require [speclj.core :refer :all]
            [oph.common.email-utils :as email-utils]))

(describe "Refuse URL"
          (it "generates proper refuse url"
              (should=
                "http://exampleurl.local/avustushaku/4/nayta?avustushaku=4&hakemus=1234567890&lang=fi&preview=true&token=abcde1234567890&refuse-grant=true&modify-application=false"
                (email-utils/refuse-url "http://exampleurl.local/" 4 "1234567890" :fi "abcde1234567890"))))

(run-specs)
