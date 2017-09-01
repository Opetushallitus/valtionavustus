(defproject oph-va/hakija "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus, hakijan lomake"
  :url "https://github.com/Opetushallitus/valtionavustus"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :dependencies [[oph-va/common "0.1.0-SNAPSHOT"]
                 ;; MIME type checking
                 [com.novemberain/pantomime "2.7.0"]]

  :main oph.va.hakija.main
  :jvm-opts ["-Xmx500m"]
  :target-path "target/%s"

  :prep-tasks [
       "compile"
  ]

  :plugins [[speclj "3.3.1"]
            [lein-modules "0.3.11"]
            [lein-environ "1.0.0"]
            [lein-shell "0.4.0"]
            [lein-auto "0.1.2"]
            [lein-ancient "0.6.7"]]

  :test-paths ["spec"]

  :uberjar-exclusions [#"public/test"]
  :auto-clean false

  :aot [oph.va.jdbc.enums
        oph.va.hakija.db.migrations
        clj-time.core]
  :profiles {:uberjar {:aot :all}
             :test    {:dependencies [[environ "1.0.2"]]}}
  :aliases {"dbmigrate" ["run" "-m" "oph.va.hakija.db.migrations/migrate" "form-db" "db.migration" "oph.va.hakija.db.migrations"]
            "dbclear" ["run" "-m" "oph.soresu.common.db/clear-db!" "form-db" "hakija"]
            "buildfront" ^{:doc "Build frontend code with npm"} ["do"
                                                                 ["shell" "npm" "install" "--no-save"]
                                                                 ["shell" "npm" "run" "build-production"]]
            "populate" ^{:doc "Generate applications"} ["run" "-m" "oph.va.hakija.cmd.populate"]})
