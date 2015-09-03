(ns oph.va.hakija.schema
  (:require [schema.core :as s]
            [oph.form.schema :refer :all]))

(s/defschema Duration {:label LocalizedString
                       :start s/Inst
                       :end s/Inst})

(s/defschema SelectionCriteria {:label LocalizedString
                                :items [LocalizedString]})

(s/defschema AvustusHakuContent {:name LocalizedString
                                 :duration Duration
                                 :selection-criteria SelectionCriteria
                                 :self-financing-percentage s/Num})

(s/defschema Environment {:name s/Str
                          :show-name s/Bool})

(s/defschema AvustusHaku {:id Long
                          :content AvustusHakuContent
                          :form Long
                          :environment Environment})
(s/defschema Hakemus
  "Hakemus contains hakemus, last submission and server validation error info about it"
  {:id     (s/maybe s/Str)
   :version Long
   :status (s/enum "new" "draft" "submitted")
   :last_status_change_at s/Inst
   :submission Submission
   :validation_errors SubmissionValidationErrors})
