(defproject oph-va/root "0.1.0-SNAPSHOT"
  :description "OPH Valtionavustus"
  :url "https://github.com/Opetushallitus/valtionavustus"
  :license {:name "EUPL licence"
            :url "http://opensource.org/licenses/EUPL-1.1"}
  :dependencies [[oph-va/common "0.1.0-SNAPSHOT"]
                 [oph-va/hakija "0.1.0-SNAPSHOT"]]

  :prep-tasks [
       "javac"
       "compile"
  ]

  :plugins [[lein-ancient "0.6.7"]
            [lein-modules "0.3.11"]]

  :modules {:dirs ["soresu-form"
                   "va-common"
                   "va-hakija"
                   "va-virkailija"]
            :inherited {:repositories [["releases" {:url "https://artifactory.oph.ware.fi/artifactory/oph-sade-release-local"
                                                    :sign-releases false
                                                    :snapshots false}]
                                       ["snapshots" {:url "https://artifactory.oph.ware.fi/artifactory/oph-sade-snapshot-local"
                                                     :releases false}]
                                       ["Laughing Panda" {:url "http://maven.laughingpanda.org/maven2"
                                                          :snapshots false}]]}
            :subprocess "../lein"})
