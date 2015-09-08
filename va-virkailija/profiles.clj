{
 :dev {:env {:config "config/dev.edn"
             :configsecrets "../../valtionavustus-secret/config/secret-dev.edn"}}
 :test {:env {:config "config/test.edn"}}
 :prod {:env {:config "config/prod.edn"}}
 :ci {:env {:config "config/test.edn"}
      :prep-tasks ^:replace [["shell" "npm" "install"]
                             ["shell" "npm" "run" "build"]
                             "clean"
                             "compile"]}
}
