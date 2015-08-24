(ns oph.va.mocha-spec
  (:use [clojure.tools.trace]
        [clojure.java.shell :only [sh]]
        [clojure.string :only [split join]])
  (:require [speclj.core :refer :all]
            [oph.va.spec-plumbing :refer :all]))

(defn is-test-output? [line]
  (or (.contains line "testcase") (.contains line "testsuite")))

(describe "Mocha UI tests /"

  (tags :ui)

  ;; Start HTTP server for running tests
  (around-all [_] (with-test-server! (_)))

  (it "are successful"
      (let [results (sh "node_modules/mocha-phantomjs/bin/mocha-phantomjs"
                        "-R" "xunit"
                        "-s" "webSecurityEnabled=false"
                        "http://localhost:9000/test/runner.html")]
        (let [output-lines (split (:out results) #"\n")
              test-run-output (filter is-test-output? output-lines)
              test-report-xml-path "target/junit-mocha-js-ui.xml"]
          (println (apply str "Writing xunit test report to " test-report-xml-path))
          (spit test-report-xml-path (join test-run-output)))
        (println (:out results))
        (.println System/err (:err results))
        (should= 0 (:exit results)))))

(describe "Mocha unit tests /"

  (tags :js-unit)

  (it "are successful"
      ;; mocha --compilers js:babel/register web/test/*Test.js
      (let [results (sh "./node_modules/mocha/bin/mocha"
                        "--compilers" "js:babel/register"
                        "--reporter" "mocha-junit-reporter"
                        "web/test/*Test.js"
                        :env {"MOCHA_FILE" "target/junit-mocha-js-unit.xml"})]
        (println (:out results))
        (.println System/err (:err results))
        (should= 0 (:exit results)))))
(run-specs)
