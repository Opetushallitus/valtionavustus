(ns oph.va.hakija.schema
  (:require [schema.core :as s]
            [oph.soresu.form.schema :refer :all]
            [oph.va.schema :refer :all]))

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
