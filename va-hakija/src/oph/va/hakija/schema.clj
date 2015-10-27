(ns oph.va.hakija.schema
  (:require [schema.core :as s]
            [oph.soresu.form.schema :refer :all]
            [oph.va.schema :refer :all]))

(s/defschema Hakemus
  "Hakemus contains hakemus, last submission and server validation error info about it"
  {:id     (s/maybe s/Str)
   :version Long
   :status HakemusStatus
   :register-number (s/maybe s/Str)
   :last-status-change-at s/Inst
   :submission Submission
   :validation-errors SubmissionValidationErrors})
