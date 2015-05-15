(defproject oph-va-backend "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus backend"
  :url "http://github.com/Opetushallitus/va/backend"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :dependencies [[org.clojure/clojure "1.6.0"]

                 ;; HTTP server
                 [javax.servlet/servlet-api "2.5"]
                 [http-kit "2.1.18"]
                 [ring/ring-devel "1.3.2"]
                 [ring/ring-core "1.3.2"]

                 ;; Routing
                 [compojure "1.3.4"]
                 [liberator "0.12.2"]

                 ;; JSON
                 [cheshire "5.4.0"]

                 ;; SQL + migrations
                 [yesql "0.4.0"]
                 [ragtime "0.3.8"]

                 ;; Testing
                 [speclj "3.2.0"]

                 ;; Swagger documentation
                 [metosin/ring-swagger "0.20.2"]

                 ;; Configuration
                 [environ "1.0.0"]]

  :main ^:skip-aot oph.va.server
  :target-path "target/%s"
  :plugins [[speclj "3.2.0"]
            [lein-environ "1.0.0"]]
  :test-paths ["spec"]
  :profiles {:uberjar {:aot :all}})
