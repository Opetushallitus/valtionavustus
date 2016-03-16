(ns oph.va.virkailija.schema
  (:require [schema.core :as s]
            [oph.soresu.form.schema :refer :all]
            [oph.va.schema :refer :all]))

(s/defschema ArvioStatus
  "Status from the opetushallitus point of view"
  (s/enum "unhandled", "processing", "plausible", "rejected", "accepted"))

(s/defschema PersonScoreAverage
  "Averga score by person"
  {:person-oid s/Str
   :first-name s/Str
   :last-name s/Str
   :email s/Str
   :score-average s/Num})

(s/defschema Scoring
  "Scoring aggregate data for arvio"
  {:arvio-id s/Int
   :score-total-average s/Num
   :score-averages-by-user [PersonScoreAverage]})

(s/defschema ArvioRole
             "Role for arvio"
             {:evaluators [Long]})

(s/defschema Arvio
  "Arvio contains evaluation of hakemus"
  {:id s/Int
   :status ArvioStatus
   :overridden-answers Answers
   :budget-granted s/Int
   :costsGranted s/Int
   :useDetailedCosts s/Bool
   :roles ArvioRole
   (s/optional-key :presenter-role-id) (s/maybe Long)
   (s/optional-key :scoring) (s/maybe Scoring)
   (s/optional-key :summary-comment) (s/maybe s/Str)
   (s/optional-key :rahoitusalue) (s/maybe s/Str)
   (s/optional-key :perustelut) (s/maybe s/Str)
  })

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

(s/defschema NewScore
  "New or updated scoring entry"
  {:selection-criteria-index s/Int
   :score s/Int})

(s/defschema Score
  "Single person and selection criteria specific score of hakemus"
  {:arvio-id Long
   :person-oid s/Str
   :first-name s/Str
   :last-name s/Str
   :email s/Str
   :selection-criteria-index s/Int
   :score s/Int
   :created-at s/Inst
   :modified-at s/Inst})

(s/defschema ScoringOfArvio
  "Single arvio scoring aggregate and complete score list"
  {:scoring (s/maybe Scoring)
   :scores [Score]})

(s/defschema Hakemus {:id s/Int
                      :version s/Int
                      :version-date s/Inst
                      :project-name s/Str
                      :organization-name s/Str
                      :status HakemusStatus
                      :status-comment (s/maybe s/Str)
                      :user-first-name (s/maybe s/Str)
                      :user-last-name (s/maybe s/Str)
                      (s/optional-key :arvio)  Arvio
                      :budget-total s/Int
                      :budget-oph-share s/Int
                      :register-number (s/maybe s/Str)
                      :user-key s/Str
                      :answers [Answer]})

(s/defschema RoleType
  (s/enum "presenting_officer" "evaluator"))

(s/defschema NewRole {:name s/Str
                      :email s/Str
                      :role (s/maybe RoleType)
                      :oid s/Str})

(s/defschema PaatosEmail {:email s/Str})

(s/defschema Role {:id s/Int
                   :name s/Str
                   :email s/Str
                   :role RoleType
                   :oid (s/maybe s/Str)})

(s/defschema HakuPrivileges
  "Privileges that curently logged in user has for certain avustushaku"
  {:edit-haku s/Bool
   :edit-my-haku-role s/Bool
   :score-hakemus s/Bool
   :change-hakemus-state s/Bool})

(s/defschema HakuData
  "Avustushaku structured response with related form, roles, hakemukset etc"
  {:avustushaku AvustusHaku
   :environment Environment
   :form {:content s/Any
          :rules s/Any}
   :roles [Role]
   :privileges HakuPrivileges
   :hakemukset [Hakemus]
   :attachments s/Any
   :budget-total-sum s/Int
   :budget-oph-share-sum s/Int
   :budget-granted-sum s/Int})

(s/defschema PaatosData
  "Decision response with related avustushaku, form, roles, hakemus"
  {:avustushaku AvustusHaku
   :form {:content s/Any
          :rules s/Any}
   :roles [Role]
   :hakemus Hakemus})

(s/defschema SavedSearch
  "Saved search listing certain hakemukset by ids or possibly dynamic search in the future"
  {:hakemus-ids (s/maybe [Long])})

(s/defschema LdapSearchResult
  "Single person entity from LDAP search"
  {:username (s/maybe s/Str)
   :person-oid (s/maybe s/Str)
   :first-name (s/maybe s/Str)
   :surname (s/maybe s/Str)
   :email (s/maybe s/Str)
   :lang (s/maybe s/Str)
   :va-user s/Bool
   :va-admin s/Bool})

(s/defschema LdapSearchResults
  "Complete results of an LDAP search"
  {:results [LdapSearchResult]
   :error s/Bool
   :truncated s/Bool})
