(def log4j-version "2.21.1")
(def jackson-version "2.15.3")
(def http4s-version "0.16.6")

(defproject oph-va/valtionavustus "0.1.0-SNAPSHOT"

  :description "OPH Valtionavustus, both services"

  :url "https://github.com/Opetushallitus/valtionavustus"

  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}

  :min-lein-version "2.7.1"

  :repositories [["releases"       {:url "https://artifactory.opintopolku.fi/artifactory/oph-sade-release-local"
                                    :sign-releases false
                                    :snapshots false}]
                 ["snapshots"      {:url "https://artifactory.opintopolku.fi/artifactory/oph-sade-snapshot-local"
                                    :releases false}]
                 ["public-github"  {:url "git://github.com"}]]

  :pedantic? :abort

  :plugins [[lein-environ "1.2.0"]
            [reifyhealth/lein-git-down "0.4.1"]]

  :managed-dependencies [

                         ;; [metosin/compojure-api 1.1.13] -> [metosin/ring-swagger 0.26.2] -> [metosin/scjsv 0.6.2] ->
                         [com.github.java-json-tools/json-schema-validator "2.2.14"]
                         ;; ... -> [com.github.java-json-tools/json-schema-validator "2.2.14"] ->
                         ;; fixes https://nvd.nist.gov/vuln/detail/cve-2020-8908
                         [com.google.guava/guava "32.1.3-android"]

                         ;; [org.postgresql/postgresql "42.6.0"] ->
                         ;; ... -> [com.google.guava/guava "32.1.3-android"] ->
                         [org.checkerframework/checker-qual "3.39.0"]

                         ;; [yesql "0.5.3"] ->
                         ;; ... -> [clout "2.2.1"] ->
                         [instaparse "1.4.12"]

                         ;; [clj-pdf "2.6.5"] ->
                         ;; [buddy/buddy-sign "3.5.351"] -> [buddy/buddy-core "1.11.423"] ->
                         [commons-codec "1.16.0"]

                         ;; [ring/ring-core "1.10.0"] -> [commons-io "2.15.0"]
                         ;; [org.apache.tika/tika-core "2.9.1"] -> [commons-io "2.15.0"]
                         [commons-io "2.15.0"]

                         ;; [clojurewerkz/quartzite "2.1.0"] ->
                         ;; fixes https://nvd.nist.gov/vuln/detail/cve-2019-13990,
                         ;; https://nvd.nist.gov/vuln/detail/CVE-2019-5427
                         [org.quartz-scheduler/quartz "2.3.2"]

                         ;; logging API
                         [org.slf4j/slf4j-api "2.0.9"]

                         ; dependencies under compojure-api -> explicitly updated for security patches
                         [ring-middleware-format "0.7.5"]
                         [org.yaml/snakeyaml "1.33"]

                         ;; [metosin/compojure-api "1.1.13"] ->
                         ;;   ... -> [com.fasterxml.jackson.core/jackson-databind "2.15.3"] ->
                         ;;             [com.fasterxml.jackson.core/jackson-annotations "2.15.3"]
                         [com.fasterxml.jackson.core/jackson-databind ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-annotations ~jackson-version]


                         ;; [cheshire "5.12.0"] -> [com.fasterxml.jackson.core/jackson-core "2.15.3"]
                         [com.fasterxml.jackson.core/jackson-core ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-cbor ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-smile ~jackson-version]

                         ;; testing
                         [speclj "3.4.3"]
                         [speclj-junit "0.0.11"]

                         ;; cas
                         [org.http4s/http4s-blaze-client_2.11 ~http4s-version]
                         [org.http4s/http4s-client_2.11 ~http4s-version]
                         [org.http4s/http4s-dsl_2.11 ~http4s-version]

                         ;; other
                         [metosin/ring-swagger-ui "5.9.0"]

                         [org.clojure/core.memoize "1.0.257"]

                         [org.scala-lang.modules/scala-xml_2.11 "1.3.1"]
                         [org.scala-lang/scala-library "2.11.12"]]

  :dependencies [[org.clojure/clojure "1.11.1"]
                 [nrepl "1.1.0"]
                 [cider/cider-nrepl "0.43.0"]
                 [environ "1.2.0"]

                 ;; clojure libs
                 [org.clojure/core.async "1.6.681"]
                 [org.clojure/data.xml "0.0.8"]
                 [org.clojure/tools.trace "0.7.11"]
                 [org.clojure/tools.logging "1.2.4"]

                 ;; logging
                 [org.apache.logging.log4j/log4j-core ~log4j-version]
                 [org.apache.logging.log4j/log4j-slf4j2-impl ~log4j-version]

                 ;; http
                 [compojure "1.7.0"]
                 [http-kit "2.7.0"]
                 [metosin/compojure-api "1.1.13"]
                 [ring.middleware.conditional "0.2.0" :exclusions [ring]]
                 [radicalzephyr/ring.middleware.logger "0.6.0"]
                 [ring/ring-codec "1.2.0"]
                 [ring/ring-core "1.10.0"]
                 [ring/ring-devel "1.10.0"]
                 [ring/ring-defaults "0.4.0"]
                 [ring/ring-session-timeout "0.3.0"]
                 [ring/ring-ssl "0.3.0"]
                 [prismatic/schema "1.4.1"]
                 [org.apache.tika/tika-core "2.9.1"] ; attachment handling

                 ;; auth
                 [buddy/buddy-auth "3.0.323"]
                 [buddy/buddy-sign "3.5.351"]
                 [fi.vm.sade/scala-cas_2.11 "2.2.3-SNAPSHOT"]
                 [org.http4s/http4s-blaze-client_2.11]

                 ;; json
                 [cheshire "5.12.0"]
                 [org.clojure/data.json "2.4.0"]

                 ;; database
                 [hikari-cp "1.8.3"]
                 [org.flywaydb/flyway-core "4.2.0"]
                 [org.postgresql/postgresql "42.6.0"]
                 [yesql "0.5.3"]

                 ;; emails
                 [org.apache.commons/commons-email "1.5"]

                 ;; täsmäytysraportti
                 [clj-pdf "2.6.5" :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]

                 ;; maksatuspalvelu
                 [org.clj-commons/clj-ssh "0.6.2"]

                 ;; miscellaneous
                 [clj-time "0.15.2"]
                 [joda-time "2.12.5"] ; also required by com.github.java-json-tools/json-schema-validator
                                      ; and clj-time
                 [de.ubercode.clostache/clostache "1.4.0"] ; email templates and some html templating somewhere

                 ;; excel spreadsheets
                 [dk.ative/docjure "1.19.0"]

                 ;; job scheduling
                 [clojurewerkz/quartzite "2.1.0"]

                 ;; ????
                 [com.cemerick/url "0.1.1" :exclusions [com.cemerick/clojurescript.test]] ; this is basically useless, we only use one function that would be trivial to implement
  ]

  :profiles {:uberjar {:aot [oph.va.hakija.main]}
             :server-dev {:env {:config "va-hakija/config/dev.edn"
                                :configsecrets "../valtionavustus-secret/config/secret-dev.edn"
                                :configdefaults "va-hakija/config/defaults.edn"}}

             :server-test {:env {:config "va-hakija/config/docker-compose-test.edn"
                                 :configdefaults "va-hakija/config/defaults.edn"}}

             :test {:env {:config "server/config/test.edn"
                          :configdefaults "server/config/test.edn"
                          :environment "test"}
                    :test-paths ["server/spec"]
                    :resource-paths ["server/test-resources"]
                    :plugins [[speclj "3.4.3"]]
                    :dependencies [[speclj]
                                   [speclj-junit]]}

             :test-legacy {:env {:config "server/config/test-legacy.edn"
                                 :configdefaults "server/config/test.edn"
                                 :environment "test"}
                           :test-paths ["server/spec"]
                           :resource-paths ["server/test-resources"]
                           :plugins [[speclj "3.4.3"]]
                           :dependencies [[speclj]
                                          [speclj-junit]]}}

  :aot [oph.va.jdbc.enums oph.va.hakija.db.migrations oph.va.virkailija.db.migrations clj-time.core]

  :source-paths ["server/src/clojure"]
  :resource-paths ["server/resources"]

  :java-source-paths ["server/src/java"]

  :uberjar-exclusions [#"^\." #"public/test"]

  :prep-tasks ["javac" "compile"]

  :target-path "target/%s"

  :auto-clean true

  :javac-options ["-target" "1.8" "-source" "1.8" "-encoding" "UTF-8" "-deprecation"]

  :jvm-opts ["-Xmx500m" "-Djava.awt.headless=true" "-Dfile.encoding=UTF-8"]
)
