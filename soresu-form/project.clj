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
                             :prep-tasks]}

  :dependencies [[org.clojure/clojure]

                 [http-kit]
                 [ring/ring-core]
                 [ring/ring-devel]
                 [compojure :exclusions [instaparse]]
                 [metosin/compojure-api :exclusions [commons-codec
                                                     instaparse
                                                     joda-time
                                                     clj-time
                                                     org.clojure/tools.reader
                                                     prismatic/schema
                                                     ring]]

                 [cheshire]
                 [prismatic/schema]

                 [org.postgresql/postgresql]
                 [yesql]
                 [hikari-cp :exclusions [prismatic/schema]]
                 [org.flywaydb/flyway-core]

                 [speclj]
                 [speclj-junit]

                 [environ]

                 [org.clojure/tools.logging]

                 [clj-time]
                 [org.clojure/tools.trace]
                 [pandect]]

  :test-paths ["spec"]

  :target-path "target/%s"
)
