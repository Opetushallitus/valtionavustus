(defproject oph-va-backend "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus backend"
  :url "http://github.com/Opetushallitus/va/backend"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [javax.servlet/servlet-api "2.5"]
                 [http-kit "2.1.18"]
                 [ring/ring-devel "1.3.2"]
                 [ring/ring-core "1.3.2"]
                 [compojure "1.3.4"]]
  :main ^:skip-aot oph.va.server
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}})
