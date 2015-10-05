(ns oph.va.virkailija.schema
  (:require [schema.core :as s]
            [oph.form.schema :refer :all]
            [oph.va.schema :refer :all]))

(s/defschema ArvioStatus
  "Status from the opetushallitus point of view"
  (s/enum "unhandled", "processing", "plausible", "rejected", "accepted"))

(s/defschema Arvio
  "Arvio contains evaluation of hakemus"
  {:status ArvioStatus
   :budget-granted s/Int})

(s/defschema NewComment
  "New comment to be added"
  {:comment s/Str})

(s/defschema Comment
  "Contains comment about hakemus"
  {:id Long
   :arvio_id Long
   :created_at s/Inst
   :first_name s/Str
   :last_name s/Str
   :email s/Str
   :comment s/Str})

(s/defschema Comments
  "Comment list"
  [Comment])

(s/defschema Hakemus {:id s/Int
                      :project-name s/Str
                      :organization-name s/Str
                      :status HakemusStatus
                      :arvio Arvio
                      :budget-total s/Int
                      :budget-oph-share s/Int
                      :user-key s/Str
                      :answers [Answer]})

(s/defschema Role {:id s/Int
                   :name s/Str
                   :email s/Str
                   :role (s/enum "presenting_officer"
                                 "evaluator")})

(s/defschema HakuData
  "Avustushaku structured response with related form, roles, hakemukset etc"
  {:avustushaku AvustusHaku
   :environment Environment
   :form {:content s/Any
          :rules s/Any}
   :roles [Role]
   :hakemukset [Hakemus]
   :attachments s/Any
   :budget-total-sum s/Int
   :budget-oph-share-sum s/Int
   :budget-granted-sum s/Int})
