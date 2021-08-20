(defproject oph-va/common "0.1.0-SNAPSHOT"

  :description "OPH Valtionavustus common parts"

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
                             :nvd]}

  :dependencies [[org.clojure/clojure]
                 [oph/soresu]
                 [de.ubercode.clostache/clostache]
                 [org.apache.commons/commons-email]
                 [org.clojure/core.async]
                 [org.apache.logging.log4j/log4j-core]
                 [org.apache.logging.log4j/log4j-slf4j-impl]
                 [ring.middleware.conditional :exclusions [ring]]
                 [radicalzephyr/ring.middleware.logger]
                 [ring/ring-defaults]]

  :aot [oph.va.jdbc.enums
        oph.va.virkailija.db.migrations]

  :test-paths ["spec"]

  :target-path "target/%s"

  :auto {:default {:paths ["src", "resources", "spec"]
                   :file-pattern #"\.(clj|sql|json)$"}}
)
