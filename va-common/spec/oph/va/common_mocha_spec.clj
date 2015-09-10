(ns oph.va.common_mocha-spec
  (:use [clojure.tools.trace]
        [clojure.java.shell :only [sh]]
        [clojure.string :only [split join]])
  (:require [speclj.core :refer :all]))

(defn is-test-output? [line]
  (or (.contains line "testcase") (.contains line "testsuite")))

(describe "Mocha unit tests /"

  (tags :js-unit)

  (it "are successful"
      (let [results (sh "./node_modules/mocha/bin/mocha"
                        "--compilers" "js:babel/register"
                        "--reporter" "mocha-junit-reporter"
                        "web/test/*Test.js"
                        :env {"MOCHA_FILE" "target/junit-mocha-js-unit.xml"})]
        (println (:out results))
        (.println System/err (:err results))
        (should= 0 (:exit results)))))
(run-specs)
