(def log4j-version "2.17.2")
(def jackson-version "2.14.2")

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

  :plugins [[lein-ancient "0.7.0"]
            [lein-auto "0.1.3"]
            [lein-environ "1.2.0"]
            [speclj "3.3.2"]
            [lein-kibit "0.1.8"]
            [jonase/eastwood "0.9.9"]
            [lein-bikeshed "0.5.2"]
            [reifyhealth/lein-git-down "0.4.1"]]

  :managed-dependencies [[org.clojure/clojure "1.9.0"]
                         [nrepl "0.9.0"]
                         [cider/cider-nrepl "0.30.0"]

                         ;; our child projects
                         [oph/soresu-form "0.1.0-SNAPSHOT"]

                         ;; http
                         [buddy/buddy-auth "2.1.0"]
                         [clout "2.2.1"]
                         [org.apache.commons/commons-compress "1.23.0"]
                         [org.apache.tika/tika-core "2.7.0"]
                         [compojure "1.7.0"]
                         [http-kit "2.6.0"]
                         [metosin/compojure-api "1.1.13"]
                         [org.yaml/snakeyaml "1.33"] ; dependency of compojure-api -> explicitly updated for security patches

                         ;; json
                         [cheshire "5.11.0"]
                         [org.clojure/data.json "0.2.7"]
                         [com.fasterxml.jackson.core/jackson-core ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-databind ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-annotations ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-cbor ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-smile ~jackson-version]
                         [prismatic/schema "1.1.6"]

                         ;; database
                         [hikari-cp "1.8.3"]
                         [org.flywaydb/flyway-core "4.2.0"]
                         [org.postgresql/postgresql "42.4.3"]
                         [yesql "0.5.3"]

                         ;; testing
                         [speclj "3.3.2"]
                         [speclj-junit "0.0.11"]

                         ;; configuration
                         [environ "1.2.0"]

                         ;; logging
                         [org.apache.logging.log4j/log4j-core ~log4j-version]
                         [org.apache.logging.log4j/log4j-slf4j-impl ~log4j-version]
                         [org.clojure/tools.logging "1.1.0"]
                         [org.slf4j/slf4j-api "1.7.36"]
                         [commons-logging "1.2"]
                         [org.log4s/log4s_2.11 "1.10.0"]

                         ;; cryptography
                         [org.bouncycastle/bcpkix-jdk15on "1.70"]
                         [org.bouncycastle/bcprov-jdk15on "1.69"]
                         [buddy/buddy-core "1.10.413"]
                         [buddy/buddy-sign "3.4.333"]

                         ;; cas
                         [fi.vm.sade/scala-cas_2.11 "2.2.2-20210929.183742-5"]
                         [org.http4s/http4s-blaze-client_2.11 "0.16.6"]
                         [org.http4s/http4s-client_2.11 "0.16.6"]
                         [org.http4s/http4s-dsl_2.11 "0.16.6"]

                         ;; other
                         [clj-time "0.15.2"]
                         [com.cemerick/url "0.1.1"]
                         [commons-codec "1.10"]
                         [commons-io "2.11.0"]
                         [de.ubercode.clostache/clostache "1.4.0"]
                         [dk.ative/docjure "1.18.0"]
                         [instaparse "1.4.12"]
                         [org.apache.commons/commons-email "1.5"]
                         [org.clojure/core.async "1.5.648"]
                         [org.clojure/tools.trace "0.7.11"]
                         [org.scala-lang.modules/scala-xml_2.11 "1.0.6"]
                         [org.scala-lang/scala-library "2.11.12"]
                         [org.clojure/data.xml "0.0.8"]
                         [clojurewerkz/quartzite "2.1.0"]
                         [org.checkerframework/checker-qual "3.17.0"]
                         [clj-commons/clj-yaml "1.0.26"]
                         [metosin/ring-swagger-ui "4.18.1"]]

  :dependencies [[org.clojure/clojure]
                 [de.ubercode.clostache/clostache]
                 [org.apache.commons/commons-email]
                 [org.clojure/core.async]
                 [org.apache.logging.log4j/log4j-core]
                 [org.apache.logging.log4j/log4j-slf4j-impl]
                 [org.apache.tika/tika-core]
                 [nrepl]
                 [buddy/buddy-auth]
                 [buddy/buddy-sign]
                 [com.cemerick/url :exclusions [com.cemerick/clojurescript.test]]
                 [dk.ative/docjure "1.18.0"]
                 [fi.vm.sade/scala-cas_2.11 "2.2.2-20210929.183742-5"]
                 [org.http4s/http4s-blaze-client_2.11 "0.16.6"]
                 [org.clojure/data.json]
                 [org.clojure/data.xml]
                 [nivekuil/clj-ssh "d11634acf9857da4c7fc98258719a333af523cb8" :exclusions [com.jcraft/jsch.agentproxy.usocket-nc]]
                 [com.jcraft/jsch "0.1.55"]
                 [gov.nasa.earthdata/quartzite "2.2.1-SNAPSHOT"]
                 [clj-pdf "2.6.2" :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]
                 [cider/cider-nrepl]
                 [http-kit]
                 [ring.middleware.conditional "0.2.0" :exclusions [ring]]
                 [ring/ring-codec "1.2.0"]
                 [ring/ring-core "1.9.6" :exclusions [commons-fileupload]]
                 [commons-fileupload "1.5"]
                 [ring/ring-devel "1.9.6"]
                 [radicalzephyr/ring.middleware.logger "0.6.0"]
                 [ring/ring-defaults "0.3.4"]
                 [ring/ring-session-timeout "0.2.0"]
                 [ring/ring-ssl "0.3.0"]
                 [compojure]
                 [metosin/compojure-api]
                 [com.github.java-json-tools/jackson-coreutils "1.12"  :exclusions [com.google.code.findbugs/jsr305]]
                 [com.google.guava/guava "31.1-jre" ]
                 [cheshire]
                 [prismatic/schema]
                 [org.postgresql/postgresql]
                 [yesql]
                 [hikari-cp]
                 [org.flywaydb/flyway-core]
                 [speclj]
                 [speclj-junit]
                 [environ]
                 [org.clojure/tools.logging]
                 [buddy/buddy-core]
                 [clj-time]
                 [org.clojure/tools.trace]]

  :profiles {:uberjar {:aot [oph.va.hakija.main oph.va.virkailija.main]}
             :hakija-dev     {:env {:config "va-hakija/config/dev.edn"
                              :configsecrets "../valtionavustus-secret/config/secret-dev.edn"
                              :environment "dev"
                              :configdefaults "va-hakija/config/defaults.edn"}}

             :virkailija-dev {:env {:config "va-virkailija/config/dev.edn"
                              :configsecrets "../valtionavustus-secret/config/secret-dev.edn"
                              :environment "dev"
                              :configdefaults "va-virkailija/config/defaults.edn"}}

             :test {:env {:config "server/config/test.edn"
                          :configdefaults "server/config/test.edn"
                          :environment "test"}
                    :test-paths ["server/spec"]
                    :resource-paths ["server/test-resources"]}

             :hakija-prod     {:env {:config "va-hakija/config/prod.edn"}}

             :virkalija-prod  {:env {:config "va-virkailija/config/va-prod.edn"}}
             }

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

  :auto {:default {:paths ["server/src"
                           "server/resources"]
                   :file-pattern #"\.(clj|sql|json|edn)$"}}
)
