(defproject oph-valtionavustus "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus"
  :url "https://github.com/Opetushallitus/valtionavustus"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :dependencies [[org.clojure/clojure "1.6.0"]

                 ;; HTTP server
                 [javax.servlet/servlet-api "2.5"]
                 [http-kit "2.1.19"]
                 [ring/ring-devel "1.3.2"]
                 [ring/ring-core "1.3.2"]

                 ;; Routing
                 [compojure "1.3.4" :exclusions [instaparse]]
                 [metosin/compojure-api "0.21.0" :exclusions [commons-codec
                                                              instaparse
                                                              joda-time
                                                              clj-time
                                                              org.clojure/tools.reader]]

                 ;; JSON
                 [cheshire "5.4.0"]

                 ;; SQL + migrations
                 [yesql "0.5.0-rc3"]
                 [org.postgresql/postgresql "9.4-1201-jdbc41"]
                 [hikari-cp "1.2.4"]
                 [org.flywaydb/flyway-core "3.2.1"]

                 ;; E-mail
                 [com.draines/postal "1.11.3"]

                 ;; Testing
                 [speclj "3.2.0"]
                 ;; for junit output: lein spec -f junit
                 [speclj-junit "0.0.10"]

                 ;; Configuration
                 [environ "1.0.0"]

                 ;; Utils
                 [org.clojure/tools.trace "0.7.8"]
                 [org.clojure/tools.logging "0.3.1"]
                 [org.slf4j/slf4j-log4j12 "1.7.12"]
                 [pandect "0.5.2"]]

  :main ^:skip-aot oph.va.server
  :target-path "target/%s"

  ;; This hooks 'npm run build' to build preparation tasks
  :prep-tasks [
       ["shell" "npm" "install"]
       ["shell" "npm" "run" "build"]
       "javac"
       "compile"
  ]

  :plugins [[speclj "3.2.0"]
            [lein-environ "1.0.0"]
            [lein-shell "0.4.0"]
            [lein-ancient "0.6.7"]]

  :test-paths ["spec"]
  :profiles {:uberjar {:aot :all}}
  :aliases {"dbmigrate" ["run" "-m" "oph.va.db.migrations/migrate"]
            "dbclear" ["run" "-m" "oph.common.db/clear-db!"]})
