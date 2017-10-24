(defproject oph-va/virkailija "0.1.0-SNAPSHOT"

  :description "OPH Valtionavustus, virkailijan käyttöliittymä"

  :plugins [[lein-parent "0.3.2"]]

  :parent-project {:path "../parent-project.clj"
                   :inherit [:url
                             :license
                             :min-lein-version
                             :repositories
                             :managed-dependencies
                             :pedantic?
                             :plugins
                             :uberjar-exclusions
                             :auto-clean
                             :javac-options]}

  :dependencies [[oph-va/common]
                 [buddy/buddy-auth]
                 [ring/ring-session-timeout]
                 [com.cemerick/url :exclusions [com.cemerick/clojurescript.test]]
                 [dk.ative/docjure]
                 [fi.vm.sade/scala-cas_2.11]
                 [org.http4s/http4s-blaze-client_2.11]
                 [org.clojars.pntblnk/clj-ldap]
                 [org.clojure/data.json]]

  :profiles {:uberjar {:aot :all}
             :dev     {:env {:config "config/dev.edn"
                             :configsecrets "../../valtionavustus-secret/config/secret-dev.edn"}}
             :test    {:env {:config "config/test.edn"}}
             :prod    {:env {:config "config/va-prod.edn"}}}

  :main oph.va.virkailija.main

  :aot [oph.va.jdbc.enums
        oph.va.virkailija.db.migrations
        clj-time.core]

  :uberjar-exclusions [#"public/test"]

  :jvm-opts ["-Xmx500m"]

  :prep-tasks ["javac" "compile"]

  :source-paths ["src/clojure"]

  :java-source-paths ["src/java"]

  :test-paths ["spec"]

  :target-path "target/%s"

  :aliases {"dbmigrate"  ["run" "-m" "oph.va.virkailija.db.migrations/migrate" "virkailija-db" "db.migration" "oph.va.virkailija.db.migrations"]

            "dbclear"    ["run" "-m" "oph.soresu.common.db/clear-db!" "virkailija-db" "virkailija"]}
)
