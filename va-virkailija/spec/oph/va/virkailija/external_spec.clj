(ns oph.va.virkailija.external-spec
  (require [schema.core :as s]
           [speclj.core
            :refer [should should-not should= describe
                    it tags around-all run-specs]]
           [oph.common.testing.spec-plumbing :refer [with-test-server!]]
           [oph.va.virkailija.server :refer [start-server]]
           [oph.va.virkailija.external-data :as external-data]
           [oph.va.virkailija.schema :refer [ExternalGrant ExternalApplication]]
           [oph.va.virkailija.grant-data :as grant-data]
           [oph.va.virkailija.db :as virkailija-db]
           [oph.soresu.form.db :as form-db]
           [oph.va.hakija.api :as hakija-api]
           [oph.va.virkailija.common-utils
            :refer [test-server-port create-submission create-application-evaluation
                    create-evaluation user-authentication
                    add-mock-authentication remove-mock-authentication]]))

(describe "Queries for external APIs"
  (tags :external)

  (around-all
    [_]
    (add-mock-authentication user-authentication)
    (with-test-server! :virkailija-db
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false}) (_))
    (remove-mock-authentication user-authentication))

  (it "returns grants for given year"
    (let [grants (external-data/get-grants-for-year 2015)]
      (should= 2 (count grants))
      (run! #(s/validate ExternalGrant %) grants))
    (should= 0 (count (external-data/get-grants-for-year 2019)))
  )

  (it "returns the project-nutshell or project-goal field of a grant as nutshell, whichever is defined"
    (let [ext-avustushaku (first (external-data/get-grants-for-year 2015))
          avustushaku-id (:id ext-avustushaku)
          avustushaku (grant-data/get-grant avustushaku-id)
          form-id (:form avustushaku)
          form (form-db/get-form form-id)]
      (hakija-api/update-form-by-avustushaku (:id avustushaku) (merge form :content (concat [blorp] (:content form))))))

   ;(hakija-api/update-form-by-avustushaku (form-db/get-form (:form (first (grant-data/get-grants))))

  (it "returns applications by grant id if they are accepted and marked as visible in external systems"
    (let [grant (first (grant-data/get-grants))]
      (create-evaluation grant "accepted" {:allow-visibility-in-external-system false})
      (create-evaluation grant "accepted" {:allow-visibility-in-external-system false})

      (should= 0 (count (external-data/get-applications-by-grant-id (:id grant))))

      (create-evaluation grant "rejected" {:allow-visibility-in-external-system true})
      (create-evaluation grant "rejected" {:allow-visibility-in-external-system true})

      (should= 0 (count (external-data/get-applications-by-grant-id (:id grant))))

      (create-evaluation grant "accepted" {:allow-visibility-in-external-system true})
      (create-evaluation grant "accepted" {:allow-visibility-in-external-system true})

      (let [applications (external-data/get-applications-by-grant-id (:id grant))]
        (should= 2 (count applications))
        (run! #(s/validate ExternalApplication %) applications)))
  ))

(def blorp {
            :id "project-goals",
            :label { :fi "Hanke pähkinänkuoressa", :sv "Projektet i ett nötskal" }
            :params { :size "small" :maxlength 1000 }
            :helpText { :fi "Kuvaa lyhyesti mistä hankkeessa on kyse.  Keskittykää kuvauksessa siihen mihin ongelmaan koulutuksella haetaan ratkaisua ja mikä muuttuu. Opetushallitus voi julkaista kuvauksen verkkosivuillaan."
                       :sv "Beskriv i korthet vad projektet handlar om. Beskriv vilket problem man vill lösa med hjälp av utbildningen och vad som kommer att förändras. Utbildningsstyrelsen kan publicera beskrivningen på sin webbsida."}
            :required true
            :fieldType "textArea"
            :fieldClass "formField"
            })

(run-specs)
