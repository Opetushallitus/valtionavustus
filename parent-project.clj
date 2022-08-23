(def log4j-version "2.17.1")
(def jackson-databind-version "2.13.2.1")
(def jackson-version "2.13.2")

(defproject oph-va/root "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus"

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

  :managed-dependencies [[org.clojure/clojure "1.9.0"]
                         [nrepl "0.9.0"]
                         [cider/cider-nrepl "0.27.4"]

                         ;; our child projects
                         [oph/soresu-form "0.1.0-SNAPSHOT"]

                         ;; http
                         [buddy/buddy-auth "2.1.0"]
                         [clout "2.2.1"]
                         [org.apache.commons/commons-compress "1.21"]
                         [org.apache.tika/tika-core "2.4.1"]
                         [compojure "1.6.2"]
                         [http-kit "2.5.3"]
                         [metosin/compojure-api "1.1.13"]
                         [ring/ring-codec "1.1.3"]
                         [ring/ring-core "1.8.1"]
                         [ring/ring-devel "1.8.1" :exclusions [hiccup]]
                         [hiccup "2.0.0-alpha2"]
                         [ring.middleware.conditional "0.2.0"]
                         [radicalzephyr/ring.middleware.logger "0.6.0"]
                         [ring/ring-defaults "0.3.3"]
                         [ring/ring-session-timeout "0.2.0"]
                         [ring/ring-ssl "0.3.0"]

                         ;; json
                         [cheshire "5.10.1"]
                         [org.clojure/data.json "0.2.6"]
                         [com.fasterxml.jackson.core/jackson-core ~jackson-version]
                         [com.fasterxml.jackson.core/jackson-databind ~jackson-databind-version]
                         [com.fasterxml.jackson.core/jackson-annotations ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-cbor ~jackson-version]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-smile ~jackson-version]
                         [prismatic/schema "1.1.6"]

                         ;; database
                         [hikari-cp "1.8.1"]
                         [org.flywaydb/flyway-core "4.2.0"]
                         [org.postgresql/postgresql "42.4.1"]
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
                         [org.slf4j/slf4j-api "1.7.32"]
                         [commons-logging "1.2"]
                         [org.log4s/log4s_2.11 "1.10.0"]

                         ;; cryptography
                         [org.bouncycastle/bcpkix-jdk15on "1.69"]
                         [org.bouncycastle/bcprov-jdk15on "1.69"]
                         [buddy/buddy-core "1.9.0"]
                         [buddy/buddy-sign "3.3.0"]

                         ;; cas
                         [fi.vm.sade/scala-cas_2.11 "2.2.2-20210318.092232-1"]
                         [org.http4s/http4s-blaze-client_2.11 "0.16.6"]
                         [org.http4s/http4s-client_2.11 "0.16.6"]
                         [org.http4s/http4s-dsl_2.11 "0.16.6"]

                         ;; other
                         [clj-time "0.14.0"]
                         [com.cemerick/url "0.1.1"]
                         [commons-codec "1.10"]
                         [commons-io "2.11.0"]
                         [de.ubercode.clostache/clostache "1.4.0"]
                         [dk.ative/docjure "1.16.0"]
                         [instaparse "1.4.10"]
                         [org.apache.commons/commons-email "1.5"]
                         [org.clojure/core.async "1.5.648"]
                         [org.clojure/tools.trace "0.7.9"]
                         [org.scala-lang.modules/scala-xml_2.11 "1.0.6"]
                         [org.scala-lang/scala-library "2.11.12"]
                         [org.clojure/data.xml "0.0.8"]
                         [clj-ssh "0.5.14"]
                         [clojurewerkz/quartzite "2.0.0"]
                         [org.checkerframework/checker-qual "3.17.0"]
                         [clj-commons/clj-yaml "0.7.107"]
                         [metosin/ring-swagger-ui "4.5.0"]]

  :pedantic? :abort

  :plugins [[lein-ancient "0.6.15"]
            [lein-auto "0.1.3"]
            [lein-environ "1.1.0"]
            [speclj "3.3.2"]
            [lein-kibit "0.1.6"]
            [jonase/eastwood "0.2.9"]
            [lein-bikeshed "0.5.1"]
            [reifyhealth/lein-git-down "0.4.0"]]

  :uberjar-exclusions [#"^\."]

  :auto-clean true

  :prep-tasks ["compile"]

  :javac-options ["-target" "1.8" "-source" "1.8" "-encoding" "UTF-8" "-deprecation"]

  :jvm-opts ["-Xmx500m" "-Djava.awt.headless=true" "-Dfile.encoding=UTF-8"]
)
