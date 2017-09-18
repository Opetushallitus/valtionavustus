(defproject oph/soresu "0.1.0-SNAPSHOT"
  :description "OPH Soresu forms"
  :url "https://github.com/Opetushallitus/valtionavustus"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :repositories {"Laughing Panda" "http://maven.laughingpanda.org/maven2"}
  :dependencies [[org.clojure/clojure]

                 [http-kit]
                 [ring/ring-core]
                 [ring/ring-devel]
                 [compojure :exclusions [instaparse]]
                 [metosin/compojure-api :exclusions [commons-codec
                                                     instaparse
                                                     joda-time
                                                     clj-time
                                                     org.clojure/tools.reader
                                                     prismatic/schema
                                                     ring]]

                 [cheshire]
                 [prismatic/schema]

                 [org.postgresql/postgresql]
                 [yesql]
                 [hikari-cp :exclusions [prismatic/schema]]
                 [org.flywaydb/flyway-core]

                 [speclj]
                 [speclj-junit]

                 [environ]

                 [org.clojure/tools.logging]

                 [clj-time]
                 [org.clojure/tools.trace]
                 [pandect]]

  :target-path "target/%s"

  :prep-tasks [
       "buildfront"
       "compile"
  ]

  :plugins [[speclj "3.3.1"]
            [lein-modules "0.3.11"]
            [lein-environ "1.0.0"]
            [lein-shell "0.4.0"]
            [lein-auto "0.1.2"]
            [lein-ancient "0.6.7"]]

  :test-paths ["spec"]

  :uberjar-exclusions [#".*"]                               ;; Kludge to make top-level "lein sub uberjar" faster
  :auto-clean false

  :aliases {"buildfront" ^{:doc "Build frontend code with npm"} ["shell" "npm" "install" "--no-save"]})
