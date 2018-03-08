(defproject applications-ui "0.1.0"
  :description "Valtionavustus hakijan hakemuksen muutoksien käyttöliittymä"

  :plugins [[lein-parent "0.3.2"]
            [lein-cljsbuild "1.1.7"]
            [lein-figwheel "0.5.14"]
            [lein-doo "0.1.8"]
            [lein-asset-minifier "0.4.4"]]

  :source-paths ["src"]

  :parent-project {:path "../parent-project.clj"
                   :inherit [:url
                             :license
                             :min-lein-version
                             :repositories
                             :managed-dependencies
                             ;:pedantic?
                             :plugins
                             :uberjar-exclusions
                             :auto-clean
                             :javac-options]}

  :dependencies [[org.clojure/clojure]
                 [org.clojure/clojurescript]
                 [reagent]
                 [cljsjs/react-dom]
                 [cljs-react-material-ui]
                 [cljs-http]
                 [com.andrewmcveigh/cljs-time]]

  :clean-targets ^{:protect false}
  [:target-path
   [:cljsbuild :builds :app :compiler :output-dir]
   [:cljsbuild :builds :app :compiler :output-to]]

  :resource-paths ["resources"]

  :figwheel {:http-server-root "."
             :nrepl-port 7003
             :nrepl-middleware ["cemerick.piggieback/wrap-cljs-repl"]
             :css-dirs ["resources/css"]}

  :minify-assets
  [[:css
    {:source "resources/css/site.css"
     :target "../va-hakija/resources/public/applications/css/site-min.css"}]]

  :cljsbuild
  {:builds
   {:app
    {:source-paths ["src" "env/dev/cljs"]
     :compiler
     {:main "oph.va.applications-ui.dev"
      :output-to "../va-hakija/resources/public/applications/js/app.js"
      :output-dir "../va-hakija/resources/public/applications/js/out"
      :asset-path "/applications/js/out"
      :source-map true
      :optimizations :none
      :pretty-print  true}
     :figwheel
     {:on-jsload "oph.va.applications-ui.core/mount-root"
      :open-urls ["http://localhost:8080/applications/"]}}
    :release
    {:source-paths ["src" "env/prod/cljs"]
     :compiler
     {:output-to "../va-hakija/resources/public/applications/js/app.js"
      :output-dir "../va-hakija/resources/public/applications/js/release"
      :asset-path "/applications/js/out"
      :optimizations :advanced
      :pretty-print false}}
    :test
    {:source-paths ["src" "test" "env/test/cljs"]
     :compiler
     {:main oph.va.applications-ui.runner
      :asset-path "target/cljstest/public/js/out"
      :output-to "target/test.js"
      :output-dir "target/cljstest/public/js/out"
      :pretty-print  true
      :target :nodejs}}}}

  :doo {:build "test"
        :alias {:default [:node]}}

  :aliases {"package" ["do" "clean" ["cljsbuild" "once" "release"] "minify-assets"]}

  :profiles {:dev {:dependencies [[com.cemerick/piggieback]
                                  [binaryage/devtools]
                                  [figwheel-sidecar]
                                  [org.clojure/tools.nrepl]
                                  [com.cemerick/piggieback]
                                  [com.google.guava/guava]]}}
  :repl-options {:nrepl-middleware [cemerick.piggieback/wrap-cljs-repl]})
