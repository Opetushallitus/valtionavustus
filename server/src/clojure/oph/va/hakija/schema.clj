(ns oph.va.hakija.schema
  (:require [schema.core :as s]
            [oph.soresu.form.schema :refer :all]
            [oph.va.schema :refer :all]))

(s/defschema JatkoaikaHakemus
  "JatkoaikaHakemus contains fields for applying for deadline extension"
  {
    :haenKayttoajanPidennysta s/Bool
    :kayttoajanPidennysPerustelut s/Str
    :haettuKayttoajanPaattymispaiva java.time.LocalDate
    })

(s/defschema Sisaltomuutos
  "JatkoaikaHakemus contains fields for applying for deadline extension"
  {
    :haenSisaltomuutosta s/Bool
    :sisaltomuutosPerustelut s/Str
    })

(s/defschema ContactPersonDetails
  "ContactPersonDetails contains contact person details in normalized format"
  {
   :name s/Str
   :email s/Str
   :phone s/Str
   })

(s/defschema TalousarvioMuutos
  "TalousarvioMuutos contains a list of menoluokka amounts"
  {s/Keyword s/Int})

(s/defschema MuutoshakemusRequest
  "MuutoshakemusRequest is the payload for applying for changes to application"
  {
    (s/optional-key :jatkoaika) JatkoaikaHakemus
    (s/optional-key :talousarvio) TalousarvioMuutos
    (s/optional-key :talousarvioPerustelut) s/Str
    (s/optional-key :yhteyshenkilo) ContactPersonDetails
    (s/optional-key :sisaltomuutos) Sisaltomuutos
  })

(s/defschema PaatosStatus
  "Status of individual muutoshakemus section paatos"
  (s/enum "accepted" "accepted_with_changes" "rejected"))

(s/defschema Paatos
  "Paatos"
  {
    :id Long
    :status s/Str
    :user-key s/Str
    :reason s/Str
    :created-at s/Inst
    :updated-at s/Inst
    (s/optional-key :paattymispaiva) (s/maybe java.time.LocalDate)
    (s/optional-key :talousarvio) (s/maybe [Meno])
    (s/optional-key :paatos-status-jatkoaika) (s/maybe PaatosStatus)
    (s/optional-key :paatos-status-talousarvio) (s/maybe PaatosStatus)
    (s/optional-key :paatos-status-sisaltomuutos) (s/maybe PaatosStatus)
    :decider s/Str
  })

(s/defschema Presenter
  "Presenter"
  {
    :name s/Str
    :email s/Str
  })

(s/defschema Avustushaku
             "Avustushaku"
             {
              :hankkeen-alkamispaiva (s/maybe java.time.LocalDate)
              :hankkeen-paattymispaiva (s/maybe java.time.LocalDate)
              })

(s/defschema MuutoshakemusPaatosDocument
  "Data for rendering a muutoshakemus paatos document"
  {
    :paatos Paatos
    :muutoshakemus Muutoshakemus
    :muutoshakemusUrl s/Str
    :presenter Presenter
    :isDecidedByUkotettuValmistelija s/Bool
    :hakemus NormalizedHakemus
    :avustushaku Avustushaku
    :muutoshakemukset MuutoshakemusList
  })

(s/defschema Hakemus
  "Hakemus contains hakemus, last submission and server validation error info about it"
  {:id     (s/maybe s/Str)
   (s/optional-key :created-at) s/Inst
   :version Long
   :version-date s/Inst
   :status HakemusStatus
   :status-comment (s/maybe s/Str)
   :register-number (s/maybe s/Str)
   :submission VaSubmission
   :validation-errors SubmissionValidationErrors
   (s/optional-key :loppuselvitys-information-verified-at) (s/maybe s/Inst)
   (s/optional-key :submitted-version) (s/maybe s/Int)
   (s/optional-key :refused) (s/maybe s/Bool)
   (s/optional-key :refused-comment) (s/maybe s/Str)
   (s/optional-key :refused-at) (s/maybe s/Inst)})

(s/defschema HakemusInfo
  "Hakemus with user key and language"
  {:id s/Str
   :language s/Str})

(s/defschema RefuseData
  "Application refuse data"
  {:comment s/Str})

(s/defschema ApplicationTokenData
  "Application token data for testing"
  {:application-id s/Int})

(s/defschema ApplicationToken
  "Application token for testing"
  {:token s/Str})

(s/defschema TokenValidity
  "Application token validity"
  {:valid s/Bool})
