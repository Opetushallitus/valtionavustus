(defproject admin-ui "0.2.0"
  :description "Valtionavustus pääkäyttäjän käyttöliittymä"

  :plugins [[lein-parent "0.3.2"]
            [lein-cljsbuild "1.1.7"]
            [lein-figwheel "0.5.16"]
            [lein-doo "0.1.10"]
            [lein-asset-minifier "0.4.4"]]

  :hooks [minify-assets.plugin/hooks]

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
                 [com.andrewmcveigh/cljs-time]
                 [cljsjs/chartjs]]

  :clean-targets ^{:protect false}
  [:target-path
   [:cljsbuild :builds :app :compiler :output-dir]
   [:cljsbuild :builds :app :compiler :output-to]]

  :resource-paths ["resources/public/admin-ui"]

  :figwheel {:http-server-root "."
             :nrepl-port 7002
             :nrepl-middleware ["cemerick.piggieback/wrap-cljs-repl"]
             :css-dirs ["../va-virkailija/resources/public/admin-ui/css"
                        "resources/public/admin-ui/css"]}

  :minify-assets [[:css
                   {:source "resources/public/admin-ui/css/site.css"
                    :target "../va-virkailija/resources/public/admin-ui/css/site-min.css"}]
                  [:css
                   {:source "node_modules/oph-virkailija-style-guide/oph-styles.css"
                    :target "../va-virkailija/resources/public/admin-ui/css/oph-styles-min.css"}]]

  :cljsbuild
  {:builds
   {:app
    {:source-paths ["src" "env/dev/cljs"]
     :compiler
     {:main "oph.va.admin-ui.dev"
      :output-to "../va-virkailija/resources/public/admin-ui/js/app.js"
      :output-dir "../va-virkailija/resources/public/admin-ui/js/out"
      :asset-path "/admin-ui/js/out"
      :source-map true
      :optimizations :none
      :pretty-print  true}
     :figwheel
     {:on-jsload "oph.va.admin-ui.core/mount-root"
      :open-urls ["http://localhost:8081/admin-ui/"]}}
    :release
    {:source-paths ["src" "env/prod/cljs"]
     :compiler
     {:output-to "../va-virkailija/resources/public/admin-ui/js/app.js"
      :output-dir "../va-virkailija/resources/public/admin-ui/js/release"
      :install-deps true
      :npm-deps {:oph-virkailija-style-guide "git+https://github.com/Opetushallitus/virkailija-styles.git"}
      :asset-path "/admin-ui/js/out"
      :optimizations :advanced
      :pretty-print false}}
    :test
    {:source-paths ["src" "test" "env/test/cljs"]
     :compiler
     {:main oph.va.admin-ui.runner
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
                                  [com.google.guava/guava]
                                  [cider/cider-nrepl "0.16.0"]]}}
  :repl-options {:nrepl-middleware [cemerick.piggieback/wrap-cljs-repl]})
