(def config (load-file (or (System/getenv "config") "config/config.edn")))

(defproject va-payments-ui "0.1.0"
  :description "Valtionavustus maksatusten käyttöliittymä"
  :url "http://github.com/opetushallitus/valtionavustus"
  :license {:name "European Union Public License 1.2 tai uudempi"
            :url "https://joinup.ec.europa.eu/community/eupl/og_page/eupl"}

  :dependencies [[org.clojure/clojure "1.8.0"]
                 [org.clojure/clojurescript "1.9.946"]
                 [reagent "0.8.0-alpha2"]
                 [cljsjs/react-dom "15.6.2-1"]
                 [cljs-react-material-ui "0.2.48"]
                 [cljs-http "0.1.43"]]

  :plugins [[lein-cljsbuild "1.1.7"]
            [lein-figwheel "0.5.14"]]

  :min-lein-version "2.5.0"

  :clean-targets ^{:protect false}
  [:target-path
   [:cljsbuild :builds :app :compiler :output-dir]
   [:cljsbuild :builds :app :compiler :output-to]]

  :resource-paths ["public"]

  :figwheel {:http-server-root "."
             :nrepl-port 7002
             :nrepl-middleware ["cemerick.piggieback/wrap-cljs-repl"]
             :css-dirs ["public/css"]
             :ring-handler "va-payments-ui.dev-server/dev-app"}
  :cljsbuild
  {:builds
   {:app
    {:source-paths ["src" "env/dev/cljs" "src_clj"]
     :compiler
     {:main "va-payments-ui.dev"
      :output-to "public/js/app.js"
      :output-dir "public/js/out"
      :asset-path "/js/out"
      :source-map true
      :optimizations :none
      :pretty-print  true
      :closure-defines #=(eval (:closure-defines config))}
     :figwheel
     {:on-jsload "va-payments-ui.core/mount-root"
      :open-urls ["http://localhost:3449/"]}}
    :release
    {:source-paths ["src" "env/prod/cljs"]
     :compiler
     {:output-to "public/js/app.js"
      :output-dir "public/js/release"
      :asset-path "/payments/js/out"
      :optimizations :advanced
      :pretty-print false
      :closure-defines #=(eval (:closure-defines config))}}
    :test
    {:source-paths ["src" "test" "env/test/cljs"]
     :compiler
     {:main va-payments-ui.main-test
      :asset-path "/js/out"
      :output-to "target/test.js"
      :output-dir "target/cljstest/public/js/out"
      :optimizations :whitespace
      :pretty-print  true}}}}

  :aliases {"package" ["do" "clean" ["cljsbuild" "once" "release"]]}

  :profiles {:dev {:dependencies [[binaryage/devtools "0.9.4"]
                                  [figwheel-sidecar "0.5.13"]
                                  [org.clojure/tools.nrepl "0.2.13"]
                                  [com.cemerick/piggieback "0.2.2"]
                                  [compojure "1.6.0"]
                                  [ring "1.6.2"]
                                  [ring/ring-defaults "0.3.1"]]}})
