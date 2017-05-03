(ns oph.va.mocha-spec
  (:use [clojure.tools.trace]
        [clojure.java.shell :only [sh]])
  (:require [environ.core :refer [env]]
            [speclj.core :refer :all]))

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
