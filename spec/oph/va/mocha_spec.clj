(ns oph.va.mocha-spec
  (:use [clojure.tools.trace]
        [clojure.java.shell :only [sh]])
  (:require [speclj.core :refer :all]
            [oph.va.server :refer :all]))

(describe "Mocha tests /"

  ;; Start HTTP server for running tests
  (around-all [_]
              (try
                (let [stop-server (start-server "localhost" 9000 false)]
                  (try (_) (finally (stop-server))))
                (catch Exception e (.printStackTrace e))
              )
  )

  (it "are successful"
      (let [results (sh "node_modules/mocha-phantomjs/bin/mocha-phantomjs" "-R" "spec" "http://localhost:9000/test/runner.html")]
        (println (:out results))
        (should= 0 (:exit results)))))
(run-specs)