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
                             :prep-tasks]}

  :dependencies [[org.clojure/clojure]
                 [oph/soresu]
                 [de.ubercode.clostache/clostache]
                 [fi.reaktor.log4j/log4j-email-throttle]
                 [org.apache.commons/commons-email]
                 [org.clojure/core.async]
                 [org.clojure/core.memoize]
                 [org.slf4j/slf4j-log4j12]
                 [log4j]
                 [ring.middleware.conditional :exclusions [ring]]
                 [ring.middleware.logger]
                 [ring/ring-defaults]]

  :test-paths ["spec"]

  :auto {:default {:paths ["src", "resources", "spec"]
                   :file-pattern #"\.(clj|sql|json)$"}}
)
