(ns oph.soresu.form.mocha-spec
  (:use [clojure.tools.trace]
        [clojure.java.shell :only [sh]])
  (:require [speclj.core :refer :all]
            [environ.core :refer [env]]))

(describe "soresu Mocha unit tests"
  (tags :mocha)

  (it "succeeds"
      (let [path    (env :path)
            results (sh "./node_modules/mocha/bin/mocha"
                        "--require" "babel-register"
                        "--reporter" "mocha-junit-reporter"
                        "web/test/*Test.js"
                        :env {"MOCHA_FILE" "target/junit-mocha-js-unit.xml"
                              "PATH" path})]
        (should= 0 (:exit results)))))

(run-specs)
