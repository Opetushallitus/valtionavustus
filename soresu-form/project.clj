(defproject,oph/soresu-form,"0.1.0-SNAPSHOT"

,,:description,"OPH,Soresu,forms"

,,:plugins,[[lein-parent,"0.3.2"]]

,,:parent-project,{:path,"../parent-project.clj"
,,,,,,,,,,,,,,,,,,,:inherit,[:url
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:license
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:min-lein-version
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:repositories
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:managed-dependencies
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:pedantic?
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:plugins
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:uberjar-exclusions
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:auto-clean
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:prep-tasks
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:nvd]}

,,:nvd,{:suppression-file,"../dependency-check-suppressionlist.xml"}

,,:dependencies,[[org.clojure/clojure]

,,,,,,,,,,,,,,,,,[http-kit]
,,,,,,,,,,,,,,,,,[ring/ring-core]
,,,,,,,,,,,,,,,,,[ring/ring-devel]
,,,,,,,,,,,,,,,,,[compojure]
,,,,,,,,,,,,,,,,,[metosin/compojure-api]
,,,,,,,,,,,,,,,,,[com.github.java-json-tools/jackson-coreutils,"1.10",,:exclusions,[com.google.code.findbugs/jsr305]]
,,,,,,,,,,,,,,,,,[com.google.guava/guava,"31.1-jre",]

,,,,,,,,,,,,,,,,,[cheshire]
,,,,,,,,,,,,,,,,,[prismatic/schema]

,,,,,,,,,,,,,,,,,[org.postgresql/postgresql]
,,,,,,,,,,,,,,,,,[yesql]
,,,,,,,,,,,,,,,,,[hikari-cp]
,,,,,,,,,,,,,,,,,[org.flywaydb/flyway-core]

,,,,,,,,,,,,,,,,,[speclj]
,,,,,,,,,,,,,,,,,[speclj-junit]

,,,,,,,,,,,,,,,,,[environ]

,,,,,,,,,,,,,,,,,[org.clojure/tools.logging]

,,,,,,,,,,,,,,,,,[buddy/buddy-core]

,,,,,,,,,,,,,,,,,[clj-time]
,,,,,,,,,,,,,,,,,[org.clojure/tools.trace]]

,,:aot,[clj-time.core]

,,:test-paths,["spec"]

,,:target-path,"target/%s"
)
