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
                             :prep-tasks
                             :jvm-opts
                             :nvd]}

  :dependencies [[oph-va/common]
                 [org.apache.tika/tika-core]
                 [nrepl]
                 [cider/cider-nrepl]
                 [org.jsoup/jsoup "1.14.2"]]

  :profiles {:uberjar {:aot [oph.va.hakija.main]}
             :dev     {:env {:config "config/dev.edn"}}
             :test    {:env {:config "config/test.edn"}
                       :resource-paths ["test-resources"]}
             :prod    {:env {:config "config/prod.edn"}}}

  :main oph.va.hakija.main

  :aot [oph.va.hakija.db.migrations oph.va.virkailija.db.migrations]

  :uberjar-exclusions [#"public/test"]

  :test-paths ["spec"]

  :target-path "target/%s"

)
