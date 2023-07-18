(def log4j-version "2.20.0")
(def jackson-version "2.15.2")
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

  :managed-dependencies [[org.clojure/clojure "1.11.1"]
                         [nrepl "1.0.0"]
                         [cider/cider-nrepl "0.30.0"]

                         ;; http
                         [buddy/buddy-auth "3.0.323"]
                         [clout "2.2.1"]
                         [org.apache.commons/commons-compress "1.23.0"]
                         [org.apache.tika/tika-core "2.8.0"]
                         [compojure "1.7.0"]
                         [http-kit "2.6.0"]
                         [metosin/compojure-api "1.1.13"]
                         [org.yaml/snakeyaml "1.33"] ; dependency of compojure-api -> explicitly updated for security patches

                         ;; json
                         [cheshire "5.11.0"]
                         [org.clojure/data.json "2.4.0"]
                         [com.fasterxml.jackson.core/jackson-core ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-databind ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-annotations ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-cbor ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-smile ~jackson-version]
                         [prismatic/schema "1.4.1"]

                         ;; database
                         [hikari-cp "1.8.3"]
                         [org.flywaydb/flyway-core "4.2.0"]
                         [org.postgresql/postgresql "42.6.0"]
                         [yesql "0.5.3"]

                         ;; testing
                         [speclj "3.4.3"]
                         [speclj-junit "0.0.11"]

                         ;; configuration
                         [environ "1.2.0"]

                         ;; logging
                         [org.apache.logging.log4j/log4j-core ~log4j-version]
                         [org.apache.logging.log4j/log4j-slf4j2-impl ~log4j-version]
                         [org.slf4j/slf4j-api "2.0.7"]
                         [commons-logging "1.2"]
                         [org.log4s/log4s_2.11 "1.10.0"]

                         ;; cryptography
                         [org.bouncycastle/bcpkix-jdk18on "1.75"]
                         [org.bouncycastle/bcprov-jdk18on "1.75"]
                         [buddy/buddy-core "1.11.418"]
                         [buddy/buddy-sign "3.5.346"]

                         ;; cas
                         [fi.vm.sade/scala-cas_2.11 "2.2.3-SNAPSHOT"]
                         [org.http4s/http4s-blaze-client_2.11 ~http4s-version]
                         [org.http4s/http4s-client_2.11 ~http4s-version]
                         [org.http4s/http4s-dsl_2.11 ~http4s-version]

                         ;; other
                         [clj-commons/clj-yaml "1.0.26"]
                         [clojurewerkz/quartzite "2.1.0"]
                         [com.cemerick/url "0.1.1"]
                         [commons-codec "1.16.0"]
                         [commons-io "2.13.0"]
                         [instaparse "1.4.12"]
                         [metosin/ring-swagger-ui "4.18.1"]
                         [org.apache.commons/commons-email "1.5"]
                         [org.clojure/core.async "1.6.673"]
                         [org.clojure/data.xml "0.0.8"]
                         [org.clojure/tools.trace "0.7.11"]
                         [org.scala-lang.modules/scala-xml_2.11 "1.3.1"]
                         [org.scala-lang/scala-library "2.11.12"]]

  :dependencies [[org.clojure/clojure]
                 [de.ubercode.clostache/clostache "1.4.0"]
                 [org.apache.commons/commons-email]
                 [org.clojure/core.async]
                 [org.apache.logging.log4j/log4j-core]
                 [org.apache.logging.log4j/log4j-slf4j2-impl]
                 [org.apache.tika/tika-core]
                 [nrepl]
                 [buddy/buddy-auth]
                 [buddy/buddy-sign]
                 [com.cemerick/url :exclusions [com.cemerick/clojurescript.test]]
                 [dk.ative/docjure "1.19.0"]
                 [fi.vm.sade/scala-cas_2.11]
                 [org.http4s/http4s-blaze-client_2.11]
                 [org.clojure/data.json]
                 [org.clojure/data.xml]
                 [nivekuil/clj-ssh "d11634acf9857da4c7fc98258719a333af523cb8" :exclusions [com.jcraft/jsch.agentproxy.usocket-nc]]
                 [com.jcraft/jsch "0.1.55"]
                 [gov.nasa.earthdata/quartzite "2.2.1-SNAPSHOT"]
                 [clj-pdf "2.6.3" :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]
                 [cider/cider-nrepl]
                 [http-kit]
                 [ring.middleware.conditional "0.2.0" :exclusions [ring]]
                 [ring/ring-codec "1.2.0"]
                 [ring/ring-core "1.10.0" :exclusions [commons-fileupload]]
                 [commons-fileupload "1.5"]
                 [ring/ring-devel "1.10.0"]
                 [radicalzephyr/ring.middleware.logger "0.6.0"]
                 [ring/ring-defaults "0.3.4"]
                 [ring/ring-session-timeout "0.3.0"]
                 [ring/ring-ssl "0.3.0"]
                 [compojure]
                 [metosin/compojure-api]
                 [com.github.java-json-tools/jackson-coreutils "2.0"  :exclusions [com.google.code.findbugs/jsr305]]
                 [com.google.guava/guava "32.0.1-jre"]
                 [cheshire]
                 [prismatic/schema]
                 [org.postgresql/postgresql]
                 [yesql]
                 [hikari-cp]
                 [org.flywaydb/flyway-core]
                 [environ]
                 [org.clojure/tools.logging "1.2.4"]
                 [buddy/buddy-core]
                 [clj-time "0.15.2"]
                 [org.clojure/tools.trace]]

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
