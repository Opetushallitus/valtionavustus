(def log4j-version "2.24.0")
(def jackson-version "2.17.2")
(def http4s-version "0.16.6")

(defproject oph-va/valtionavustus "0.1.0-SNAPSHOT"

  :description "OPH Valtionavustus, both services"

  :url "https://github.com/Opetushallitus/valtionavustus"

  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}

  :min-lein-version "2.7.1"

  :repositories [["public-github"  {:url "git://github.com"}]]

  :pedantic? :abort

  :plugins [[lein-environ "1.2.0"]
            [reifyhealth/lein-git-down "0.4.1"]]

  :managed-dependencies [

                         ;; [metosin/compojure-api 1.1.14] -> [metosin/ring-swagger 1.0.0] -> [metosin/scjsv 0.6.2] ->
                         [com.github.java-json-tools/json-schema-validator "2.2.14"]
                         ;; ... -> [com.github.java-json-tools/json-schema-validator "2.2.14"] ->
                         ;; fixes https://nvd.nist.gov/vuln/detail/cve-2020-8908
                         [com.google.guava/guava "33.3.0-android"]

                         ;; [org.postgresql/postgresql "42.7.4"] ->
                         ;; ... -> [com.google.guava/guava "33.3.0-android"] ->
                         [org.checkerframework/checker-qual "3.47.0"]

                         ;; [yesql "0.5.3"] ->
                         ;; ... -> [clout "2.2.1"] ->
                         [instaparse "1.5.0"]

                         ;; [clj-pdf "2.6.8"] ->
                         ;; [buddy/buddy-sign "3.5.351"] -> [buddy/buddy-core "1.12.0-430"] ->
                         [commons-codec "1.17.1"]

                         ;; [ring/ring-core "1.12.2"] -> [commons-io "2.16.1"]
                         ;; [org.apache.tika/tika-core "2.9.2"] -> [commons-io "2.16.1"]
                         [commons-io "2.16.1"]

                         ;; [clojurewerkz/quartzite "2.2.0"] ->
                         ;; fixes https://nvd.nist.gov/vuln/detail/cve-2019-13990,
                         ;; https://nvd.nist.gov/vuln/detail/CVE-2019-5427
                         [org.quartz-scheduler/quartz "2.3.2"]

                         ;; logging API
                         [org.slf4j/slf4j-api "2.0.16"]

                         ; dependencies under compojure-api -> explicitly updated for security patches
                         [ring-middleware-format "0.7.5"]
                         [org.yaml/snakeyaml "1.33"]

                         ;; [metosin/compojure-api "1.1.14"] ->
                         ;;   ... -> [com.fasterxml.jackson.core/jackson-databind ~jackson-version] ->
                         ;;             [com.fasterxml.jackson.core/jackson-annotations ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-databind ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-annotations ~jackson-version]


                         ;; [cheshire "5.13.0"] -> [com.fasterxml.jackson.core/jackson-core ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-core ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-cbor ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-smile ~jackson-version]

                         ;; testing
                         [speclj "3.4.3"]
                         [speclj-junit "0.0.11"]

                         ;; other
                         [metosin/ring-swagger-ui "5.9.0"]

                         [org.clojure/core.memoize "1.1.266"]

                         [org.scala-lang.modules/scala-xml_2.11 "1.3.1"]
                         [org.scala-lang/scala-library "2.11.12"]]

  :dependencies [[org.clojure/clojure "1.12.0"]
                 [nrepl "1.3.0"]
                 [cider/cider-nrepl "0.50.2"]
                 [environ "1.2.0"]

                 ;; clojure libs
                 [org.clojure/core.async "1.6.681"]
                 [org.clojure/data.xml "0.0.8"]
                 [org.clojure/tools.trace "0.8.0"]
                 [org.clojure/tools.logging "1.3.0"]

                 ;; logging
                 [org.apache.logging.log4j/log4j-core ~log4j-version]
                 [org.apache.logging.log4j/log4j-slf4j2-impl ~log4j-version]
                 [org.apache.logging.log4j/log4j-layout-template-json ~log4j-version]

                 ;; http
                 [compojure "1.7.1"]
                 [http-kit "2.8.0"]
                 [metosin/compojure-api "1.1.14"]
                 [ring.middleware.conditional "0.2.0" :exclusions [ring]]
                 [radicalzephyr/ring.middleware.logger "0.6.0"]
                 [ring/ring-codec "1.2.0"]
                 [ring/ring-core "1.12.2"]
                 [ring/ring-devel "1.12.2"]
                 [ring/ring-defaults "0.5.0"]
                 [ring/ring-session-timeout "0.3.0"]
                 [ring/ring-ssl "0.4.0"]
                 [prismatic/schema "1.4.1"]
                 [org.apache.tika/tika-core "2.9.2"] ; attachment handling

                 ;; auth
                 [buddy/buddy-auth "3.0.323"]
                 [buddy/buddy-sign "3.5.351" :exclusions [org.bouncycastle/bcprov-jdk18on]]
                 [org.bouncycastle/bcprov-jdk18on "1.78.1"] ;; CVE-2024-29857, CVE-2024-30171, CVE-2024-30172

                 ;; json
                 [cheshire "5.13.0"]
                 [org.clojure/data.json "2.5.0"]

                 ;; database
                 [hikari-cp "1.8.3"]
                 [org.flywaydb/flyway-core "4.2.0"]
                 [org.postgresql/postgresql "42.7.4"]
                 [yesql "0.5.3"]

                 ;; emails
                 [org.apache.commons/commons-email "1.6.0"]

                 ;; täsmäytysraportti
                 [clj-pdf "2.6.8" :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]

                 ;; maksatuspalvelu
                 [org.clj-commons/clj-ssh "0.6.6"]

                 ;; miscellaneous
                 [clj-time "0.15.2"]
                 [joda-time "2.13.0"] ; also required by com.github.java-json-tools/json-schema-validator
                                      ; and clj-time
                 [de.ubercode.clostache/clostache "1.4.0"] ; email templates and some html templating somewhere

                 ;; excel spreadsheets
                 [dk.ative/docjure "1.19.0" :exclusions [org.apache.commons/commons-compress]]
                 [org.apache.commons/commons-compress "1.27.1"] ; Fix CVE-2024-25710, CVE-2024-26308


                 ;; job scheduling
                 [clojurewerkz/quartzite "2.2.0"]

                 ;; ????
                 [com.cemerick/url "0.1.1" :exclusions [com.cemerick/clojurescript.test]] ; this is basically useless, we only use one function that would be trivial to implement
                 ]

  :profiles {:uberjar {:aot [oph.va.hakija.main]}
             :server-local {:env {:config "va-hakija/config/local.edn"
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

  :jvm-opts ["-Xmx1500m" "-Djava.awt.headless=true" "-Dfile.encoding=UTF-8"]
)
