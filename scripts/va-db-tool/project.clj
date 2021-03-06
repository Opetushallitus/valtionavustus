(defproject oph-va/db-tool "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus, DB tools"

  :plugins [[lein-parent "0.3.2"]]

  :parent-project {:path "../../parent-project.clj"
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
                             :jvm-opts]}

  :dependencies [[org.clojure/clojure]
                 [oph/soresu]
                 [org.slf4j/slf4j-log4j12]
                 [log4j]]

  :profiles {:uberjar {:aot [oph.va.db-tool.main]}}

  :env {:config "config/defaults.edn"}

  :main oph.va.db-tool.main

  :target-path "target/%s"
)
