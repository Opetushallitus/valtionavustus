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
                 [oph/soresu-form]
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
                 [dk.ative/docjure "1.16.0"]
                 [fi.vm.sade/scala-cas_2.11]
                 [org.http4s/http4s-blaze-client_2.11 "0.16.6"]
                 [org.clojure/data.json]
                 [org.clojure/data.xml]
                 [nivekuil/clj-ssh "d11634acf9857da4c7fc98258719a333af523cb8" :exclusions [com.jcraft/jsch.agentproxy.usocket-nc]]
                 [com.jcraft/jsch "0.1.55"]
                 [gov.nasa.earthdata/quartzite "2.2.1-SNAPSHOT"]
                 [clj-pdf "2.5.8"]
                 [org.apache.xmlgraphics/batik-codec "1.14" :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]
                 [org.apache.xmlgraphics/batik-bridge "1.14" :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]
                 [org.apache.xmlgraphics/batik-anim "1.14" :exclusions [org.apache.xmlgraphics/xmlgraphics-commons]]
                 [org.apache.xmlgraphics/xmlgraphics-commons "2.6"]
                 [cider/cider-nrepl]
                 [org.jsoup/jsoup "1.14.2"]]

  :profiles {:uberjar {:aot [oph.va.hakija.main oph.va.virkailija.main]}
             :hakija-dev     {:env {:config "va-hakija/config/dev.edn"
                              :configsecrets "../valtionavustus-secret/config/secret-dev.edn"
                              :environment "dev"
                              :configdefaults "va-hakija/config/defaults.edn"}}

             :virkailija-dev {:env {:config "va-virkailija/config/dev.edn"
                              :configsecrets "../valtionavustus-secret/config/secret-dev.edn"
                              :environment "dev"
                              :configdefaults "va-virkailija/config/defaults.edn"}}

             :hakija-test    {:env {:config "va-hakija/config/test.edn"
                              :environment "test"
                              :configdefaults "va-hakija/config/defaults.edn"}
                              :test-paths ["va-hakija/spec"]
                              :resource-paths ["va-hakija/test-resources"]}

             :virkailija-test {:env {:config "va-virkailija/config/test.edn"
                                     :environment "test"
                                     :configdefaults "va-virkailija/config/defaults.edn"}
                                     :test-paths ["va-virkailija/spec"]
                                     :resource-paths ["va-virkailija/test-resources"]}

             :hakija-prod     {:env {:config "va-hakija/config/prod.edn"}}

             :virkalija-prod  {:env {:config "va-virkailija/config/va-prod.edn"}}
             }
  
  :aot [oph.va.jdbc.enums oph.va.hakija.db.migrations oph.va.virkailija.db.migrations]

  :source-paths ["va-hakija/src", "va-virkailija/src/clojure"]
  :resource-paths ["va-hakija/resources", "va-virkailija/resources"]

  :java-source-paths ["va-virkailija/src/java"]

  :uberjar-exclusions [#"public/test"]

  :prep-tasks ["javac" "compile"]

  :target-path "target/%s"

  :auto {:default {:paths ["va-hakija/src", "va-hakija/resources", "va-hakija/spec",
                           "va-virkailija/src", "va-virkailija/resources", "va-virkailija/spec"]
                   :file-pattern #"\.(clj|sql|json|edn)$"}}
)
