(defproject oph-va/virkailija "0.1.0-SNAPSHOT"

  :description "OPH Valtionavustus, virkailijan käyttöliittymä"

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
                             :javac-options
                             :jvm-opts]}

  :dependencies [[oph-va/common]
                 [buddy/buddy-auth]
                 [ring/ring-session-timeout]
                 [com.cemerick/url :exclusions [com.cemerick/clojurescript.test]]
                 [dk.ative/docjure]
                 [fi.vm.sade/scala-cas_2.11]
                 [org.http4s/http4s-blaze-client_2.11]
                 [org.clojure/data.json]
                 [org.clojure/data.xml]
                 [clj-ssh]
                 [clojurewerkz/quartzite]
                 [clj-pdf "2.4.0"]
                 [nrepl]
                 [cider/cider-nrepl]]

  :profiles {:uberjar {:aot [oph.va.virkailija.main]}
             :dev     {:env {:config "config/dev.edn"
                             :configsecrets "../../valtionavustus-secret/config/secret-dev.edn"
                             :environment "dev"}}
             :test    {:env {:config "config/test.edn"
                             :environment "test"}
                       :resource-paths ["test-resources"]}
             :prod    {:env {:config "config/va-prod.edn"}}}

  :main oph.va.virkailija.main

  :uberjar-exclusions [#"public/test"]

  :prep-tasks ["javac" "compile"]

  :source-paths ["src/clojure"]

  :java-source-paths ["src/java"]

  :test-paths ["spec"]

  :target-path "target/%s"

)
