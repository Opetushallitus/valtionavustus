(ns oph.va.mocha-spec
  (:use [clojure.tools.trace]
        [clojure.java.shell :only [sh]])
  (:require [speclj.core :refer :all]
            [oph.va.spec-plumbing :refer :all]))

(describe "Mocha UI tests /"

  (tags :ui)

  ;; Start HTTP server for running tests
  (around-all [_] (with-test-server! (_)))

  (it "are successful"
      (let [results (sh "node_modules/mocha-phantomjs/bin/mocha-phantomjs" "-R" "spec" "-s" "webSecurityEnabled=false" "http://localhost:9000/test/runner.html")]
        (println (:out results))
        (should= 0 (:exit results)))))

(describe "Mocha unit tests /"

  (tags :js-unit)

  (it "are successful"
      ;; mocha --compilers js:babel/register web/test/*Test.js
      (let [results (sh "./node_modules/mocha/bin/mocha" "--compilers" "js:babel/register" "web/test/*Test.js")]
        (println (:out results))
        (should= 0 (:exit results)))))
(run-specs)
