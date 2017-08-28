(defproject oph-va/common "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus common parts"
  :url "https://github.com/Opetushallitus/valtionavustus"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [oph/soresu "0.1.0-SNAPSHOT"]

                 ;; HTTP server
                 [javax.servlet/servlet-api "2.5"]
                 [http-kit "2.1.19"]
                 [ring "1.4.0"]
                 [ring/ring-jetty-adapter "1.4.0"]
                 [ring/ring-servlet "1.4.0"]
                 [ring/ring-devel "1.4.0"]
                 [ring/ring-core "1.4.0"]

                 ;; Routing
                 [ring/ring-defaults "0.1.5"]
                 [compojure "1.4.0" :exclusions [instaparse]]
                 [metosin/compojure-api "0.23.1" :exclusions [commons-codec
                                                              instaparse
                                                              joda-time
                                                              clj-time
                                                              org.clojure/tools.reader
                                                              prismatic/schema]]

                 ;; JSON
                 [cheshire "5.5.0"]

                 ;; SQL + migrations
                 [yesql "0.5.3"]
                 [org.postgresql/postgresql "9.4.1212"]
                 [hikari-cp "1.7.5" :exclusions [prismatic/schema]]
                 [org.flywaydb/flyway-core "4.0.3"]

                 ;; E-mail
                 [org.apache.commons/commons-email "1.4"]
                 [de.ubercode.clostache/clostache "1.4.0"]
                 [org.clojure/core.async "0.2.371"]

                 ;; Testing
                 [speclj "3.3.1"]
                 ;; for junit output: lein spec -f junit
                 [speclj-junit "0.0.11"]

                 ;; Configuration
                 [environ "1.0.1"]

                 ;; Logging
                 [org.slf4j/slf4j-log4j12 "1.7.12"]
                 [org.clojure/tools.logging "0.3.1"]
                 [ring.middleware.logger "0.5.0"]
                 [ring.middleware.conditional "0.2.0"]
                 [fi.reaktor.log4j/log4j-email-throttle "1.0.0"]

                 ;; Utils
                 [org.clojure/tools.trace "0.7.9"]
                 [clj-time "0.11.0"]
                 [pandect "0.5.4"]]

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

  :auto {:default {:paths ["src", "resources", "spec"]
                   :file-pattern #"\.(clj|sql|json)$"}}

  :aliases {"buildfront" ^{:doc "Build frontend code with npm"} ["shell" "npm" "install" "--no-save"]})
