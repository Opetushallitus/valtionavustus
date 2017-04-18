(ns oph.va.mocha-spec
  (:use [clojure.java.shell :only [sh]])
  (:require [speclj.core :refer :all]
            [environ.core :refer [env]]))

(describe "va-common JavaScript Mocha unit tests"
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
