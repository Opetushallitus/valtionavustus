(defproject oph/soresu "0.1.0-SNAPSHOT"

  :description "OPH Soresu forms"

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
                             :aliases]}

  :dependencies [[org.clojure/clojure]

                 [http-kit]
                 [ring/ring-core]
                 [ring/ring-devel]
                 [compojure]
                 [metosin/compojure-api]

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

  :test-paths ["spec"]

  :target-path "target/%s"
)
