(defproject oph-va/virkailija "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus, virkailijakäyttöliittymä"
  :url "https://github.com/Opetushallitus/valtionavustus"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :repositories {"OPH" ~(str (.toURI (.getCanonicalFile (java.io.File. "../oph-m2-repo"))))
                }
  :dependencies [[oph-va/common "0.1.0-SNAPSHOT"]
                 [org.clojars.pntblnk/clj-ldap "0.0.9"]
                 [buddy/buddy-auth "0.6.1"]
                 [com.cemerick/url "0.1.1"]
                 [oph/clj-util "0.1.0-SNAPSHOT"]]

  :main oph.va.virkailija.main
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
        oph.va.virkailija.db.migrations]
  :profiles {:uberjar {:aot [oph.va.virkailija.main]}}
  :aliases {"dbmigrate" ["run" "-m" "oph.va.virkailija.db.migrations/migrate" "db.migration"]
            "dbclear" ["run" "-m" "oph.soresu.common.db/clear-db!" "db" "virkailija"]
            "buildfront" ^{:doc "Build frontend code with npm"}
            ["do" ["shell" "npm" "install"] ["shell" "npm" "run" "build"]]})
