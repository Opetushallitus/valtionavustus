(defproject oph-va/root "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus"

  :url "https://github.com/Opetushallitus/valtionavustus"

  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}

  :min-lein-version "2.7.1"

  :repositories [["releases"       {:url "https://artifactory.oph.ware.fi/artifactory/oph-sade-release-local"
                                    :sign-releases false
                                    :snapshots false}]
                 ["snapshots"      {:url "https://artifactory.oph.ware.fi/artifactory/oph-sade-snapshot-local"
                                    :releases false}]
                 ["Laughing Panda" {:url "http://maven.laughingpanda.org/maven2"
                                    :snapshots false}]]

  :managed-dependencies [[org.clojure/clojure "1.8.0"]

                         ;; our child projects
                         [oph/soresu "0.1.0-SNAPSHOT"]
                         [oph-va/common "0.1.0-SNAPSHOT"]

                         ;; http
                         [buddy/buddy-auth "2.1.0"]
                         [com.novemberain/pantomime "2.7.0"]
                         [compojure "1.6.0"]
                         [http-kit "2.2.0"]
                         [metosin/compojure-api "1.1.11"]
                         [ring/ring-core "1.6.2"]
                         [ring/ring-devel "1.6.2"]
                         [ring.middleware.conditional "0.2.0"]
                         [ring.middleware.logger "0.5.0"]
                         [ring/ring-defaults "0.3.1"]

                         ;; json
                         [cheshire "5.8.0"]
                         [org.clojure/data.json "0.2.6"]
                         [prismatic/schema "1.1.6"]

                         ;; database
                         [hikari-cp "1.7.5"]
                         [org.flywaydb/flyway-core "4.0.3"]
                         [org.postgresql/postgresql "9.4.1212"]
                         [yesql "0.5.3"]

                         ;; ldap
                         [org.clojars.pntblnk/clj-ldap "0.0.12"]

                         ;; testing
                         [speclj "3.3.1"]
                         [speclj-junit "0.0.11"]

                         ;; configuration
                         [environ "1.1.0"]

                         ;; logging
                         [fi.reaktor.log4j/log4j-email-throttle "1.0.0"]
                         [log4j "1.2.17"]
                         [org.clojure/tools.logging "0.4.0"]
                         [org.slf4j/slf4j-log4j12 "1.7.25"]

                         ;; other
                         [buddy/buddy-core "1.4.0"]
                         [clj-time "0.14.0"]
                         [com.cemerick/url "0.1.1"]
                         [com.google.guava/guava "17.0"]
                         [commons-codec "1.10"]
                         [commons-io "2.5"]
                         [de.ubercode.clostache/clostache "1.4.0"]
                         [dk.ative/docjure "1.9.0"]
                         [instaparse "1.4.7"]
                         [oph/clj-util "0.1.0"]
                         [org.apache.commons/commons-email "1.5"]
                         [org.clojure/core.async "0.3.443"]
                         [org.clojure/core.memoize "0.5.9"]
                         [org.clojure/tools.reader "1.1.0"]
                         [org.clojure/tools.trace "0.7.9"]
                         [org.scala-lang.modules/scala-xml_2.11 "1.0.6"]
                         [org.scala-lang/scala-library "2.11.11"]]

  :pedantic? :abort

  :plugins [[lein-ancient "0.6.12"]
            [lein-auto "0.1.3"]
            [lein-environ "1.1.0"]
            [speclj "3.3.2"]]

  :uberjar-exclusions [#"^\."]

  :auto-clean true

  :prep-tasks ["compile"]
)
