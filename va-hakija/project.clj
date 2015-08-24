(defproject oph-valtionavustus "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus"
  :url "https://github.com/Opetushallitus/valtionavustus"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :repositories {"Laughing Panda" "http://maven.laughingpanda.org/maven2"}
  :dependencies [[oph-valtionavustus/va-common "0.1.0-SNAPSHOT"]]

  :main ^:skip-aot oph.va.server
  :target-path "target/%s"

  :prep-tasks [
       "javac"
       "compile"
  ]

  :plugins [[speclj "3.3.1"]
            [lein-environ "1.0.0"]
            [lein-shell "0.4.0"]
            [lein-ancient "0.6.7"]]

  :test-paths ["spec"]

  :uberjar-exclusions [#"public/test"]

  :aot [oph.va.db.migrations]
  :profiles {:uberjar {:aot [oph.va.server]}}
  :aliases {"dbmigrate" ["run" "-m" "oph.va.db.migrations/migrate"]
            "dbclear" ["run" "-m" "oph.common.db/clear-db!"]
            "buildfront" ^{:doc "Build frontend code with npm"}
            ["do" ["shell" "npm" "install"] ["shell" "npm" "run" "build"]]})
