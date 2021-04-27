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
                                    :releases false}]]

  :managed-dependencies [[org.clojure/clojure "1.8.0"]
                         [nrepl "0.6.0"]
                         [cider/cider-nrepl "0.22.4"]

                         ;; our child projects
                         [oph/soresu "0.1.0-SNAPSHOT"]
                         [oph-va/common "0.1.0-SNAPSHOT"]

                         ;; http
                         [buddy/buddy-auth "2.1.0"]
                         [clout "2.2.1"]
                         [com.novemberain/pantomime "2.9.0"]
                         [compojure "1.6.1"]
                         [http-kit "2.4.0"]
                         [metosin/compojure-api "1.1.12"]
                         [ring/ring-codec "1.1.1"]
                         [ring/ring-core "1.6.3"]
                         [ring/ring-devel "1.6.3"]
                         [ring.middleware.conditional "0.2.0"]
                         [ring.middleware.logger "0.5.0"]
                         [ring/ring-defaults "0.3.1"]
                         [ring/ring-session-timeout "0.2.0"]

                         ;; json
                         [cheshire "5.8.0"]
                         [org.clojure/data.json "0.2.6"]
                         [com.fasterxml.jackson.core/jackson-core "2.9.1"]
                         [com.fasterxml.jackson.core/jackson-databind "2.9.1"]
                         [com.fasterxml.jackson.core/jackson-annotations "2.9.1"]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-cbor "2.9.1"]
                         [com.fasterxml.jackson.dataformat/jackson-dataformat-smile "2.9.1"]
                         [prismatic/schema "1.1.6"]

                         ;; database
                         [hikari-cp "1.8.1"]
                         [org.flywaydb/flyway-core "4.2.0"]
                         [org.postgresql/postgresql "42.2.18"]
                         [yesql "0.5.3"]

                         ;; testing
                         [speclj "3.3.1"]
                         [speclj-junit "0.0.11"]

                         ;; configuration
                         [environ "1.1.0"]

                         ;; logging
                         [log4j "1.2.17"]
                         [org.clojure/tools.logging "0.4.0"]
                         [org.slf4j/slf4j-log4j12 "1.7.25"]
                         [org.slf4j/slf4j-api "1.7.25"]
                         [commons-logging "1.2"]
                         [org.log4s/log4s_2.11 "1.4.0"]

                         ;; cryptography
                         [org.bouncycastle/bcpkix-jdk15on "1.58"]
                         [org.bouncycastle/bcprov-jdk15on "1.58"]
                         [buddy/buddy-core "1.4.0"]

                         ;; cas
                         [fi.vm.sade/scala-cas_2.11 "2.2.2-SNAPSHOT"]
                         [org.http4s/http4s-blaze-client_2.11 "0.16.5"]
                         [org.http4s/http4s-client_2.11 "0.16.5"]
                         [org.http4s/http4s-dsl_2.11 "0.16.5"]

                         ;; ClojureScript
                         [org.clojure/clojurescript "1.10.339"]
                         [reagent "0.8.1"]
                         [cljsjs/react-dom "16.4.1-0"]
                         [cljs-react-material-ui "0.2.50"]
                         [cljs-http "0.1.45"]
                         [com.andrewmcveigh/cljs-time "0.5.2"]
                         [cljsjs/chartjs "2.7.0-0"]

                         ;; CLJS Dev
                         [com.cemerick/piggieback "0.2.2"]
                         [binaryage/devtools "0.9.10"]
                         [figwheel-sidecar "0.5.16"]
                         [com.google.guava/guava "23.6-jre"
                          :exclusions [com.google.code.findbugs/jsr305]]

                         ;; other
                         [clj-time "0.14.0"]
                         [com.cemerick/url "0.1.1"]
                         [commons-codec "1.10"]
                         [commons-io "2.5"]
                         [de.ubercode.clostache/clostache "1.4.0"]
                         [dk.ative/docjure "1.12.0"]
                         [instaparse "1.4.7"]
                         [org.apache.commons/commons-email "1.5"]
                         [org.clojure/core.async "0.4.474"]
                         [org.clojure/tools.reader "1.1.0"]
                         [org.clojure/tools.trace "0.7.9"]
                         [org.scala-lang.modules/scala-xml_2.11 "1.0.6"]
                         [org.scala-lang/scala-library "2.11.11"]
                         [org.clojure/data.xml "0.0.8"]
                         [clj-ssh "0.5.14"]
                         [clojurewerkz/quartzite "2.0.0"]]

  :pedantic? :abort

  :plugins [[lein-ancient "0.6.15"]
            [lein-auto "0.1.3"]
            [lein-environ "1.1.0"]
            [speclj "3.3.2"]
            [lein-kibit "0.1.6"]
            [jonase/eastwood "0.2.9"]
            [lein-bikeshed "0.5.1"]]

  :uberjar-exclusions [#"^\."]

  :auto-clean true

  :prep-tasks ["compile"]

  :javac-options ["-target" "1.8" "-source" "1.8" "-encoding" "UTF-8" "-deprecation"]

  :jvm-opts ["-Xmx500m" "-Djava.awt.headless=true" "-Dfile.encoding=UTF-8"]
)
