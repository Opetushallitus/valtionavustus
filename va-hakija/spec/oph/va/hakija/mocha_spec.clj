(ns oph.va.hakija.mocha-spec
  (:use [clojure.tools.trace]
        [clojure.java.shell :only [sh]]
        [clojure.string :only [split join]])
  (:require [environ.core :refer [env]]
            [speclj.core :refer :all]
            [oph.common.testing.spec-plumbing :refer :all]
            [oph.va.hakija.server :refer :all]))

(defn is-test-output? [line]
  (or (.contains line "testcase") (.contains line "testsuite")))

(describe "va-hakija JavaScript Mocha UI tests"
  (tags :mocha-ui)

  ;; Start HTTP server for running tests
  (around-all [_] (with-test-server! :form-db #(start-server "localhost" 9000 false) (_)))

  (it "succeeds"
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

(describe "va-hakija JavaScript Mocha unit tests"
  (tags :mocha)

  (it "succeeds"
      (let [path    (env :path)
            results (sh "./node_modules/mocha/bin/mocha"
                        "--require" "web/test/babelhook"
                        "--reporter" "mocha-junit-reporter"
                        "web/test/*Test.js"
                        :env {"MOCHA_FILE" "target/junit-mocha-js-unit.xml"
                              "PATH" path})]
        (should= 0 (:exit results)))))

(run-specs)
