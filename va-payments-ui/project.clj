(def config (load-file (or (System/getenv "CONFIG") "config/default.edn")))

(println "Configuration:" config)

(defproject va-payments-ui "0.1.0"
  :description "Valtionavustus maksatusten käyttöliittymä"

  :plugins [[lein-parent "0.3.2"]
            [lein-cljsbuild "1.1.7"]
            [lein-figwheel "0.5.14"]
            [lein-doo "0.1.8"]]

  :parent-project {:path "../parent-project.clj"
                   :inherit [:url
                             :license
                             :min-lein-version
                             :repositories
;                             :managed-dependencies
;                             :pedantic?
                             :plugins
                             :uberjar-exclusions
                             :auto-clean
                             :javac-options]}

  :dependencies [[org.clojure/clojure "1.8.0"]
                 [org.clojure/clojurescript "1.9.946"]
                 [reagent "0.8.0-alpha2"]
                 [cljsjs/react-dom "15.6.2-1"]
                 [cljs-react-material-ui "0.2.48"]
                 [cljs-http "0.1.43"]]

  :clean-targets ^{:protect false}
  [:target-path
   [:cljsbuild :builds :app :compiler :output-dir]
   [:cljsbuild :builds :app :compiler :output-to]]

  :resource-paths ["../va-virkailija/resources/public/payments"]

  :figwheel {:http-server-root "."
             :nrepl-port 7002
             :nrepl-middleware ["cemerick.piggieback/wrap-cljs-repl"]
             :css-dirs ["../va-virkailija/resources/public/payments/css"]}
  :cljsbuild
  {:builds
   {:app
    {:source-paths ["src" "env/dev/cljs"]
     :compiler
     {:main "va-payments-ui.dev"
      :output-to "../va-virkailija/resources/public/payments/js/app.js"
      :output-dir "../va-virkailija/resources/public/payments/js/out"
      :asset-path "/payments/js/out"
      :source-map true
      :optimizations :none
      :pretty-print  true
      :closure-defines #=(eval (:closure-defines config))}
     :figwheel
     {:on-jsload "va-payments-ui.core/mount-root"
      :open-urls ["http://localhost:8081/payments/"]}}
    :release
    {:source-paths ["src" "env/prod/cljs"]
     :compiler
     {:output-to "../va-virkailija/resources/public/payments/js/app.js"
      :output-dir "../va-virkailija/resources/public/payments/js/release"
      :asset-path "/payments/js/out"
      :optimizations :advanced
      :pretty-print false
      :closure-defines #=(eval (:closure-defines config))}}
    :test
    {:source-paths ["src" "test" "env/test/cljs"]
     :compiler
     {:main va-payments-ui.runner
      :asset-path "target/cljstest/public/js/out"
      :output-to "target/test.js"
      :output-dir "target/cljstest/public/js/out"
      :pretty-print  true
      :target :nodejs}}}}

  :doo {:build "test"
        :alias {:default [:node]}}

  :aliases {"package" ["do" "clean" ["cljsbuild" "once" "release"]]}

  :profiles {:dev {:dependencies [[binaryage/devtools "0.9.4"]
                                  [figwheel-sidecar "0.5.13"]
                                  [org.clojure/tools.nrepl "0.2.13"]
                                  [com.cemerick/piggieback "0.2.2"]
                                  [compojure "1.6.0"]
                                  [ring "1.6.2"]
                                  [ring/ring-defaults "0.3.1"]]}})
