(ns oph.va.virkailija.schema
  (:require [schema.core :as s]
            [oph.form.schema :refer :all]
            [oph.va.schema :refer :all]))

(s/defschema Hakemus {:id s/Int
                      :project-name s/Str
                      :organization-name s/Str
                      :status HakemusStatus
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
   :form {:content s/Any
          :rules s/Any}
   :roles [Role]
   :hakemukset [Hakemus]
   :budget-total-sum s/Int
   :budget-oph-share-sum s/Int})
