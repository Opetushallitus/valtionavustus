(defproject oph-va/common "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus common parts"
  :url "https://github.com/Opetushallitus/valtionavustus"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
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

  :target-path "target/%s"

  :prep-tasks [
       "buildfront"
       "compile"
  ]

  :plugins [[speclj "3.3.1"]
            [lein-modules "0.3.11"]
            [lein-environ "1.0.0"]
            [lein-shell "0.4.0"]
            [lein-auto "0.1.2"]
            [lein-ancient "0.6.7"]]

  :test-paths ["spec"]

  :uberjar-exclusions [#".*"]                               ;; Kludge to make top-level "lein sub uberjar" faster
  :auto-clean false

  :auto {:default {:paths ["src", "resources", "spec"]
                   :file-pattern #"\.(clj|sql|json)$"}}

  :aliases {"buildfront" ^{:doc "Build frontend code with npm"} ["shell" "npm" "install" "--no-save"]})
