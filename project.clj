(defproject oph-valtionavustus "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus"
  :url "https://github.com/Opetushallitus/valtionavustus"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :repositories {"Laughing Panda" "http://maven.laughingpanda.org/maven2"}
  :dependencies [[oph-valtionavustus/va-common "0.1.0-SNAPSHOT"]
                 [oph-valtionavustus/va-hakija "0.1.0-SNAPSHOT"]]

  :prep-tasks [
       "javac"
       "compile"
  ]

  :plugins [[lein-ancient "0.6.7"]
            [lein-modules "0.3.11"]]

  :modules {:dirs ["va-common"
                   "va-hakija"] })
