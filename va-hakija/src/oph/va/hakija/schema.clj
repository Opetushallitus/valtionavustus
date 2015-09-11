(ns oph.va.hakija.schema
  (:require [schema.core :as s]
            [oph.form.schema :refer :all]
            [oph.va.schema :refer :all]))

(s/defschema Hakemus
  "Hakemus contains hakemus, last submission and server validation error info about it"
  {:id     (s/maybe s/Str)
   :version Long
   :status (s/enum "new" "draft" "submitted")
   :last_status_change_at s/Inst
   :submission Submission
   :validation_errors SubmissionValidationErrors})
