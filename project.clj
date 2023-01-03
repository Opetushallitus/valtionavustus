(def batik-version "1.16")

(defproject oph-va/valtionavustus "0.1.0-SNAPSHOT"

  :description "OPH Valtionavustus, both services"

  :plugins [[lein-parent "0.3.2"]]

  :parent-project {:path "./parent-project.clj"
                   :inherit [:url
                             :license
                             :min-lein-version
                             :repositories
                             :managed-dependencies
                             :pedantic?
                             :plugins
                             :uberjar-exclusions
                             :auto-clean
                             :prep-tasks
                             :jvm-opts
                             :nvd]}

  :dependencies [[org.clojure/clojure]
                 [de.ubercode.clostache/clostache]
                 [org.apache.commons/commons-email]
                 [org.clojure/core.async]
                 [org.apache.logging.log4j/log4j-core]
                 [org.apache.logging.log4j/log4j-slf4j-impl]
                 [ring.middleware.conditional :exclusions [ring]]
                 [radicalzephyr/ring.middleware.logger]
                 [ring/ring-defaults]
                 [org.apache.tika/tika-core]
                 [nrepl]
                 [buddy/buddy-auth]
                 [buddy/buddy-sign]
                 [ring/ring-session-timeout]
                 [ring/ring-ssl]
                 [com.cemerick/url :exclusions [com.cemerick/clojurescript.test]]
                 [dk.ative/docjure "1.18.0"]
                 [fi.vm.sade/scala-cas_2.11]
                 [org.http4s/http4s-blaze-client_2.11 "0.16.6"]
                 [org.clojure/data.json]
                 [org.clojure/data.xml]
                 [nivekuil/clj-ssh "d11634acf9857da4c7fc98258719a333af523cb8" :exclusions [com.jcraft/jsch.agentproxy.usocket-nc]]
                 [com.jcraft/jsch "0.1.55"]
                 [gov.nasa.earthdata/quartzite "2.2.1-SNAPSHOT"]
                 [clj-pdf "2.5.8"]
                 [org.apache.xmlgraphics/batik-codec ~batik-version :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]
                 [org.apache.xmlgraphics/batik-bridge ~batik-version :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]
                 [org.apache.xmlgraphics/batik-anim ~batik-version :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]
                 [org.apache.xmlgraphics/xmlgraphics-commons "2.6"]
                 [cider/cider-nrepl]
                 [http-kit]
                 [ring/ring-core]
                 [ring/ring-devel]
                 [compojure]
                 [metosin/compojure-api]
                 [com.github.java-json-tools/jackson-coreutils "1.10"  :exclusions [com.google.code.findbugs/jsr305]]
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

             :test {:env {:config "va-virkailija/config/test.edn"
                          :environment "test"
                          :configdefaults "va-virkailija/config/defaults.edn"}
                    :test-paths ["server/spec"]
                    :resource-paths ["server/test-resources"]}

             :hakija-prod     {:env {:config "va-hakija/config/prod.edn"}}

             :virkalija-prod  {:env {:config "va-virkailija/config/va-prod.edn"}}
             }
  
  :aot [oph.va.jdbc.enums oph.va.hakija.db.migrations oph.va.virkailija.db.migrations clj-time.core]

  :source-paths ["server/src/clojure"]
  :resource-paths ["server/resources" "soresu-form/resources" "va-hakija/resources", "va-virkailija/resources"]

  :java-source-paths ["server/src/java"]

  :uberjar-exclusions [#"public/test"]

  :prep-tasks ["javac" "compile"]

  :target-path "target/%s"

  :auto {:default {:paths ["server/src", "va-hakija/resources", "va-hakija/spec",
                           "va-virkailija/resources", "va-virkailija/spec"]
                   :file-pattern #"\.(clj|sql|json|edn)$"}}
)
