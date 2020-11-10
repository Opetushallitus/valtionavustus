(ns oph.va.hakija.schema
  (:require [schema.core :as s]
            [oph.soresu.form.schema :refer :all]
            [oph.va.schema :refer :all]))

(s/defschema Muutoshakemus
  "Muutoshakemus for a specific hakemus"
  {
    :id Long
    :user-key s/Str
    :hakemus-version Long
    :haen-kayttoajan-pidennysta s/Bool
    :kayttoajan-pidennys-perustelut (s/maybe s/Str)
    :haettu-kayttoajan-paattymispaiva (s/maybe java.time.LocalDate)
    :created-at s/Inst
    })

(s/defschema JatkoaikaHakemus
  "JatkoaikaHakemus contains fields for applying for deadline extension"
  {
    :haenKayttoajanPidennysta s/Bool
    :kayttoajanPidennysPerustelut s/Str
    :haettuKayttoajanPaattymispaiva java.time.LocalDate
    })

(s/defschema ContactPersonDetails
  "ContactPersonDetails contains contact person details in normalized format"
  {
   :name s/Str
   :email s/Str
   :phone s/Str
   })

(s/defschema MuutoshakemusRequest
  "MuutoshakemusRequest is the payload for applying for changes to application"
  {
    :hakemusVersion Long
    (s/optional-key :jatkoaika) JatkoaikaHakemus
    (s/optional-key :yhteyshenkilo) ContactPersonDetails
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
