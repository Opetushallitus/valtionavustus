(def log4j-version "2.26.1")
(def jackson-version "2.22.1")
(def jackson-annotations-version "2.22")
(def http4s-version "0.16.6")
(def flyway-version "12.9.0")

(defproject oph-va/valtionavustus "0.1.0-SNAPSHOT"

  :description "OPH Valtionavustus, both services"

  :url "https://github.com/Opetushallitus/valtionavustus"

  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
   :scm {:name "" }

  :exact-lein-version "2.11.2"

  :repositories [["public-github"  {:url "git://github.com"}]]

  :pedantic? :abort

  :plugins [[lein-environ "1.2.0"][dev.weavejester/lein-cljfmt "0.16.4" :exclusions [org.clojure/clojure org.clojure/spec.alpha org.clojure/core.specs.alpha]]]

  :managed-dependencies [

                         ;; [metosin/compojure-api 1.1.14] -> [metosin/ring-swagger 1.1.0] -> [metosin/scjsv 0.6.2] ->
                         [com.github.java-json-tools/json-schema-validator "2.2.14"]
                         ;; ... -> [com.github.java-json-tools/json-schema-core "1.2.14"] ->
                         ;; fixes CVE-2025-66453 (DoS via toFixed())
                         [org.mozilla/rhino "1.9.1"]
                         ;; ... -> [com.github.java-json-tools/json-schema-validator "2.2.14"] ->
                         ;; fixes https://nvd.nist.gov/vuln/detail/cve-2020-8908
                         [com.google.guava/guava "33.6.0-android"]

                         ;; [org.postgresql/postgresql "42.7.13"] ->
                         ;; ... -> [com.google.guava/guava "33.6.0-android"] ->
                         [org.checkerframework/checker-qual "4.2.1"]

                         ;; ... -> [clout "2.2.1"] ->
                         [instaparse "1.5.0"]

                         ;; [clj-pdf "2.8.0"] ->
                         ;; [buddy/buddy-sign "3.6.1-359"] -> [buddy/buddy-core "1.12.0-430"] ->
                         [commons-codec "1.22.0"]

                         ;; [ring/ring-core "1.15.5"] -> [commons-io "2.22.0"]
                         ;; [org.apache.tika/tika-core "3.3.1"] -> [commons-io "2.22.0"]
                         [commons-io "2.22.0"]

                         ;; [clojurewerkz/quartzite "2.2.0"] ->
                         ;; fixes https://nvd.nist.gov/vuln/detail/cve-2019-13990,
                         ;; https://nvd.nist.gov/vuln/detail/CVE-2019-5427
                         [org.quartz-scheduler/quartz "2.5.2"]

                         ;; logging API
                         [org.slf4j/slf4j-api "2.0.18"]

                         ; dependencies under compojure-api -> explicitly updated for security patches
                         [ring-middleware-format "0.7.5"]
                         [clj-commons/clj-yaml "1.0.29"]
                         [org.yaml/snakeyaml "2.6"]

                         ;; [metosin/compojure-api "1.1.14"] ->
                         ;;   ... -> [com.fasterxml.jackson.core/jackson-databind ~jackson-version] ->
                         ;;             [com.fasterxml.jackson.core/jackson-annotations ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-databind ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-annotations ~jackson-annotations-version]


                         ;; [cheshire "6.2.0"] -> [com.fasterxml.jackson.core/jackson-core ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-core ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-cbor ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-smile ~jackson-version]


                         ;; other
                         [metosin/ring-swagger-ui "5.32.6"]

                         [org.clojure/core.memoize "1.2.281"]]

  :dependencies [[org.clojure/clojure "1.12.5"]
                 [environ "1.2.0"]

                 ;; clojure libs
                 [org.clojure/core.async "1.9.865"]
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
                 [ring/ring-core "1.15.5"]
                 [ring/ring-devel "1.15.5"]
                 [ring/ring-defaults "0.7.1"]
                 [ring/ring-session-timeout "0.3.0"]
                 [ring/ring-ssl "0.4.0"]
                 [prismatic/schema "1.4.1"]
                 [org.apache.tika/tika-core "3.3.1"] ; attachment handling

                 ;; auth
                 [buddy/buddy-auth "3.0.323"]
                 [buddy/buddy-sign "3.6.1-359" :exclusions [org.bouncycastle/bcprov-jdk18on]]
                 [org.bouncycastle/bcprov-jdk18on "1.84"] ;; CVE-2024-29857, CVE-2024-30171, CVE-2024-30172

                 ;; json
                 [cheshire "6.2.0"]
                 [org.clojure/data.json "2.5.2"]

                 ;; database
                 [hikari-cp "4.1.0"]
                 [org.flywaydb/flyway-core ~flyway-version]
                 [org.flywaydb/flyway-database-postgresql ~flyway-version]

                 [org.postgresql/postgresql "42.7.13"]
                 [org.clojure/java.jdbc "0.7.12"]

                 ;; emails
                 [org.apache.commons/commons-email "1.6.0"]

                 ;; täsmäytysraportti
                 [clj-pdf "2.8.0" :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]

                 ;; maksatuspalvelu
                 [org.clj-commons/clj-ssh "0.6.6"]

                 ;; miscellaneous
                 [clj-time "0.15.2"]
                 [joda-time "2.14.2"] ; also required by com.github.java-json-tools/json-schema-validator
                                      ; and clj-time
                 [de.ubercode.clostache/clostache "1.4.0"] ; email templates and some html templating somewhere

                 ;; excel spreadsheets
                 [dk.ative/docjure "1.22.0" :exclusions [org.apache.commons/commons-compress]]
                 [org.apache.commons/commons-compress "1.28.0"] ; Fix CVE-2024-25710, CVE-2024-26308


                 ;; job scheduling
                 [clojurewerkz/quartzite "2.2.0"]

                 ]

  :profiles {:dev {:dependencies [[nrepl "1.7.0"]
                                   [cider/cider-nrepl "0.62.1"]]}
             :uberjar {:aot [oph.va.hakija.main]
                        :main oph.va.hakija.main}
             :server-local {:env {:config "server/config/local.edn"
                                :configsecrets "../valtionavustus-secret/config/secret-dev.edn"
                                :configdefaults "server/config/defaults.edn"}}

             :server-test {:env {:config "server/config/docker-compose-test.edn"
                                 :configdefaults "server/config/defaults.edn"}}

             ;; CI fallback: route Maven Central requests through Google's
             ;; rate-limit-friendly mirror. Activated by Dockerfile.va-app
             ;; when direct central access fails (typically a 429).
             :central-mirror-google
             {:mirrors {"central" {:name "Google Maven Central mirror"
                                   :url "https://maven-central.storage-download.googleapis.com/maven2/"}}}}

  :aot [oph.va.jdbc.enums oph.va.hakija.db.migrations oph.va.virkailija.db.migrations clj-time.core]

  :source-paths ["server/src/clojure"]
  :resource-paths ["server/resources"]

  :uberjar-exclusions [#"^\." #"public/test"]

  :target-path "target/%s"

  :auto-clean true

  :jvm-opts ["-Xmx1500m" "-Djava.awt.headless=true" "-Dfile.encoding=UTF-8"]
)
