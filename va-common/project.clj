(defproject oph-va/common "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus common parts"
  :url "https://github.com/Opetushallitus/valtionavustus"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :repositories {"Laughing Panda" "http://maven.laughingpanda.org/maven2"}
  :dependencies [[org.clojure/clojure "1.7.0"]

                 ;; HTTP server
                 [javax.servlet/servlet-api "2.5"]
                 [http-kit "2.1.19"]
                 [ring "1.4.0"]
                 [ring/ring-jetty-adapter "1.4.0"]
                 [ring/ring-servlet "1.4.0"]
                 [ring/ring-devel "1.4.0"]
                 [ring/ring-core "1.4.0"]

                 ;; Routing
                 [compojure "1.4.0" :exclusions [instaparse]]
                 [metosin/compojure-api "0.23.0" :exclusions [commons-codec
                                                              instaparse
                                                              joda-time
                                                              clj-time
                                                              org.clojure/tools.reader
                                                              prismatic/schema]]

                 ;; JSON
                 [cheshire "5.5.0"]
                 [prismatic/schema "0.4.4"]

                 ;; SQL + migrations
                 [yesql "0.5.0"]
                 [org.postgresql/postgresql "9.4-1201-jdbc41"]
                 [hikari-cp "1.3.0" :exclusions [prismatic/schema]]
                 [org.flywaydb/flyway-core "3.2.1"]

                 ;; E-mail
                 [org.apache.commons/commons-email "1.4"]
                 [de.ubercode.clostache/clostache "1.4.0"]
                 [org.clojure/core.async "0.1.346.0-17112a-alpha"]

                 ;; Testing
                 [speclj "3.3.1"]
                 ;; for junit output: lein spec -f junit
                 [speclj-junit "0.0.10"]

                 ;; Configuration
                 [environ "1.0.0"]

                 ;; Logging
                 [org.slf4j/slf4j-log4j12 "1.7.12"]
                 [org.clojure/tools.logging "0.3.1"]
                 [ring.middleware.logger "0.5.0"]
                 [ring.middleware.conditional "0.2.0"]
                 [fi.reaktor.log4j/log4j-email-throttle "1.0.0"]

                 ;; Utils
                 [org.clojure/tools.trace "0.7.8"]
                 [clj-time "0.11.0"]
                 [pandect "0.5.3"]]

  :target-path "target/%s"

  :prep-tasks [
       "javac"
       "compile"
  ]

  :plugins [[speclj "3.3.1"]
            [lein-environ "1.0.0"]
            [lein-shell "0.4.0"]
            [lein-auto "0.1.2"]
            [lein-ancient "0.6.7"]]

  :test-paths ["spec"]

  :uberjar-exclusions [#".*"]                               ;; Kludge to make top-level "lein sub uberjar" faster

  :aliases {"dbmigrate" ["run" "-m" "oph.va.db.migrations/migrate"]
            "dbclear" ["run" "-m" "oph.common.db/clear-db!"]})
