(def log4j-version "2.25.3")
(def jackson-version "2.21.0")
(def jackson-annotations-version "2.21")
(def http4s-version "0.16.6")
(def flyway-version "11.20.2")

(defproject oph-va/valtionavustus "0.1.0-SNAPSHOT"

  :description "OPH Valtionavustus, both services"

  :url "https://github.com/Opetushallitus/valtionavustus"

  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
   :scm {:name "" }

  :exact-lein-version "2.11.2"

  :repositories [["public-github"  {:url "git://github.com"}]]

  :pedantic? :abort

  :plugins [[lein-environ "1.2.0"][dev.weavejester/lein-cljfmt "0.15.6"]]

  :managed-dependencies [

                         ;; [metosin/compojure-api 1.1.14] -> [metosin/ring-swagger 1.0.0] -> [metosin/scjsv 0.6.2] ->
                         [com.github.java-json-tools/json-schema-validator "2.2.14"]
                         ;; ... -> [com.github.java-json-tools/json-schema-validator "2.2.14"] ->
                         ;; fixes https://nvd.nist.gov/vuln/detail/cve-2020-8908
                         [com.google.guava/guava "33.5.0-android"]

                         ;; [org.postgresql/postgresql "42.7.9"] ->
                         ;; ... -> [com.google.guava/guava "33.5.0-android"] ->
                         [org.checkerframework/checker-qual "3.52.1"]

                         ;; [yesql "0.5.4"] ->
                         ;; ... -> [clout "2.2.1"] ->
                         [instaparse "1.5.0"]

                         ;; [clj-pdf "2.7.4"] ->
                         ;; [buddy/buddy-sign "3.6.1-359"] -> [buddy/buddy-core "1.12.0-430"] ->
                         [commons-codec "1.20.0"]

                         ;; [ring/ring-core "1.15.3"] -> [commons-io "2.21.0"]
                         ;; [org.apache.tika/tika-core "3.2.3"] -> [commons-io "2.21.0"]
                         [commons-io "2.21.0"]

                         ;; [clojurewerkz/quartzite "2.2.0"] ->
                         ;; fixes https://nvd.nist.gov/vuln/detail/cve-2019-13990,
                         ;; https://nvd.nist.gov/vuln/detail/CVE-2019-5427
                         [org.quartz-scheduler/quartz "2.5.2"]

                         ;; logging API
                         [org.slf4j/slf4j-api "2.0.17"]

                         ; dependencies under compojure-api -> explicitly updated for security patches
                         [ring-middleware-format "0.7.5"]
                         [org.yaml/snakeyaml "1.33"]

                         ;; [metosin/compojure-api "1.1.14"] ->
                         ;;   ... -> [com.fasterxml.jackson.core/jackson-databind ~jackson-version] ->
                         ;;             [com.fasterxml.jackson.core/jackson-annotations ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-databind ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-annotations ~jackson-annotations-version]


                         ;; [cheshire "6.1.0"] -> [com.fasterxml.jackson.core/jackson-core ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-core ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-cbor ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-smile ~jackson-version]


                         ;; other
                         [metosin/ring-swagger-ui "5.20.0"]

                         [org.clojure/core.memoize "1.1.266"]]

  :dependencies [[org.clojure/clojure "1.12.3"]
                 [environ "1.2.0"]

                 ;; clojure libs
                 [org.clojure/core.async "1.8.741"]
                 [org.clojure/data.xml "0.0.8"]
                 [org.clojure/tools.trace "0.9.0"]
                 [org.clojure/tools.logging "1.3.1"]

                 ;; logging
                 [org.apache.logging.log4j/log4j-core ~log4j-version]
                 [org.apache.logging.log4j/log4j-slf4j2-impl ~log4j-version]
                 [org.apache.logging.log4j/log4j-layout-template-json ~log4j-version]

                 ;; http
                 [compojure "1.7.2"]
                 [http-kit "2.8.1"]
                 [metosin/compojure-api "1.1.14"]
                 [ring.middleware.conditional "0.2.0" :exclusions [ring]]
                 [radicalzephyr/ring.middleware.logger "0.6.0"]
                 [ring/ring-codec "1.3.0"]
                 [ring/ring-core "1.15.3"]
                 [ring/ring-devel "1.15.3"]
                 [ring/ring-defaults "0.7.0"]
                 [ring/ring-session-timeout "0.3.0"]
                 [ring/ring-ssl "0.4.0"]
                 [prismatic/schema "1.4.1"]
                 [org.apache.tika/tika-core "3.2.3"] ; attachment handling

                 ;; auth
                 [buddy/buddy-auth "3.0.323"]
                 [buddy/buddy-sign "3.6.1-359" :exclusions [org.bouncycastle/bcprov-jdk18on]]
                 [org.bouncycastle/bcprov-jdk18on "1.83"] ;; CVE-2024-29857, CVE-2024-30171, CVE-2024-30172

                 ;; json
                 [cheshire "6.1.0"]
                 [org.clojure/data.json "2.5.2"]

                 ;; database
                 [hikari-cp "3.3.0"]
                 [org.flywaydb/flyway-core ~flyway-version]
                 [org.flywaydb/flyway-database-postgresql ~flyway-version]

                 [org.postgresql/postgresql "42.7.9"]
                 [yesql "0.5.4"]

                 ;; emails
                 [org.apache.commons/commons-email "1.6.0"]

                 ;; täsmäytysraportti
                 [clj-pdf "2.7.4" :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]

                 ;; maksatuspalvelu
                 [org.clj-commons/clj-ssh "0.6.6"]

                 ;; miscellaneous
                 [clj-time "0.15.2"]
                 [joda-time "2.14.0"] ; also required by com.github.java-json-tools/json-schema-validator
                                      ; and clj-time
                 [de.ubercode.clostache/clostache "1.4.0"] ; email templates and some html templating somewhere

                 ;; excel spreadsheets
                 [dk.ative/docjure "1.22.0" :exclusions [org.apache.commons/commons-compress]]
                 [org.apache.commons/commons-compress "1.28.0"] ; Fix CVE-2024-25710, CVE-2024-26308


                 ;; job scheduling
                 [clojurewerkz/quartzite "2.2.0"]

                 ;; ????
                 [com.cemerick/url "0.1.1" :exclusions [com.cemerick/clojurescript.test]] ; this is basically useless, we only use one function that would be trivial to implement
                 ]

  :profiles {:dev {:dependencies [[nrepl "1.5.2"]
                                   [cider/cider-nrepl "0.58.0"]]}
             :uberjar {:aot [oph.va.hakija.main]
                        :main oph.va.hakija.main}
             :server-local {:env {:config "server/config/local.edn"
                                :configsecrets "../valtionavustus-secret/config/secret-dev.edn"
                                :configdefaults "server/config/defaults.edn"}}

             :server-test {:env {:config "server/config/docker-compose-test.edn"
                                 :configdefaults "server/config/defaults.edn"}}}

  :aot [oph.va.jdbc.enums oph.va.hakija.db.migrations oph.va.virkailija.db.migrations clj-time.core]

  :source-paths ["server/src/clojure"]
  :resource-paths ["server/resources"]

  :uberjar-exclusions [#"^\." #"public/test"]

  :target-path "target/%s"

  :auto-clean true

  :jvm-opts ["-Xmx1500m" "-Djava.awt.headless=true" "-Dfile.encoding=UTF-8"]
)
