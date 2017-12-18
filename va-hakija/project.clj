(defproject oph-va/hakija "0.1.0-SNAPSHOT"

  :description "OPH Valtionavustus, hakijan lomake"

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
                             :prep-tasks]}

  :dependencies [[oph-va/common]
                 [com.novemberain/pantomime]]

  :profiles {:uberjar {:aot :all}
             :dev     {:env {:config "config/dev.edn"}}
             :test    {:env {:config "config/test.edn"}}
             :prod    {:env {:config "config/prod.edn"}}}

  :main oph.va.hakija.main

  :aot [oph.va.jdbc.enums
        oph.va.hakija.db.migrations
        clj-time.core]

  :uberjar-exclusions [#"public/test"]

  :jvm-opts ["-Xmx500m"]

  :test-paths ["spec"]

  :target-path "target/%s"

  :aliases {"dbmigrate"  ["run" "-m" "oph.va.hakija.db.migrations/migrate" "form-db" "db.migration" "oph.va.hakija.db.migrations"]

            "dbclear"    ["run" "-m" "oph.soresu.common.db/clear-db!" "form-db" "hakija"]

            "populate"   ^{:doc "Generate applications"} ["run" "-m" "oph.va.hakija.cmd.populate"]}
)
