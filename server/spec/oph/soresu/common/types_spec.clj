(ns oph.soresu.common.types-spec
  (:require [speclj.core :refer :all]
            [oph.soresu.common.types :refer :all]))

(describe "types, checking 1d sequentials"
  (it "checks if sequential argument has expected type as the first element"
    (should= true (sequential-of? String ["a"]))
    (should= true (sequential-of? String '("a")))
    (should= false (sequential-of? Integer ["a"])))

  (it "returns true for empty sequential argument"
    (should= true (sequential-of? String []))
    (should= true (sequential-of? String '())))

  (it "returns false for non-sequential argument"
    (should= false (sequential-of? String nil))
    (should= false (sequential-of? String "a"))
    (should= false (sequential-of? String 1))))

(describe "types, checking 2d sequentials"
  (it "checks if sequential argument has expected type as the first element"
    (should= true (sequential-2d-of? String [["a"]]))
    (should= true (sequential-2d-of? String '(("a"))))
    (should= true (sequential-2d-of? String ['("a")]))
    (should= true (sequential-2d-of? String [["a"]]))
    (should= false (sequential-2d-of? Integer [["a"]])))

  (it "returns true for empty sequential argument"
    (should= true (sequential-2d-of? String []))
    (should= true (sequential-2d-of? String '()))
    (should= true (sequential-2d-of? String [[]]))
    (should= true (sequential-2d-of? String '(()))))

  (it "returns false for non-sequential argument"
    (should= false (sequential-2d-of? String nil))
    (should= false (sequential-2d-of? String "a"))
    (should= false (sequential-2d-of? String 1)))

  (it "returns false for 1d sequential argument"
    (should= false (sequential-2d-of? String ["a"]))
    (should= false (sequential-2d-of? String '("a")))))

(run-specs)
