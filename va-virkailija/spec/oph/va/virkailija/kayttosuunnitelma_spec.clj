(ns oph.va.virkailija.kayttosuunnitelma-spec
  (:require [speclj.core :refer :all]
            [oph.va.virkailija.kayttosuunnitelma :as ks])
  (:import [java.math RoundingMode]))

(describe "Käyttösuunnitelma"
          (tags :kayttosuunnitelma)

          (describe "rounding decimals"
                    (it "rounds decimal with traditional rounding"
                        (should= "0.1" (str (ks/round-decimal 0.1 1)))
                        (should= "0.1" (str (ks/round-decimal 0.14 1)))
                        (should= "0.2" (str (ks/round-decimal 0.15 1)))
                        (should= "13.46" (str (ks/round-decimal 13.455 2))))

                    (it "rounds decimal with floor rounding"
                        (should= "0.1" (str (ks/round-decimal 0.1 1 RoundingMode/FLOOR)))
                        (should= "0.1" (str (ks/round-decimal 0.10 1 RoundingMode/FLOOR)))
                        (should= "0.1" (str (ks/round-decimal 0.19 1 RoundingMode/FLOOR)))
                        (should= "13.11" (str (ks/round-decimal 13.119 2 RoundingMode/FLOOR))))

                    (it "rounds decimal with ceiling rounding"
                        (should= "0.1" (str (ks/round-decimal 0.1 1 RoundingMode/CEILING)))
                        (should= "0.1" (str (ks/round-decimal 0.10 1 RoundingMode/CEILING)))
                        (should= "0.2" (str (ks/round-decimal 0.11 1 RoundingMode/CEILING)))
                        (should= "13.12" (str (ks/round-decimal 13.111 2 RoundingMode/CEILING)))))

          (describe "formatting decimals"
                    (it "formats decimal"
                        (should= "13" (ks/format-decimal 13)))

                    (it "removes trailing .0 from decimal"
                        (should= "10" (ks/format-decimal 10.000)))

                    (it "outputs comma as decimal separator"
                        (should= "13,0001" (ks/format-decimal 13.0001)))))

(run-specs)
