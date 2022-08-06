(ns oph.va.virkailija.schema
  (:require [schema.core :as s]
            [oph.soresu.form.schema :as soresu-schema]
            [oph.va.schema :as va-schema])
  (:import (java.time LocalDate)))

(s/defschema ArvioStatus
  "Status from the opetushallitus point of view"
  (s/enum "unhandled", "processing", "plausible", "rejected", "accepted"))

(s/defschema TalousarvioMuutos
  "TalousarvioMuutos contains a list of menoluokka amounts"
  {s/Keyword s/Int})

(s/defschema MuutoshakemusPaatos
  "Muutoshakemus paatos"
  {:id Long
   (s/optional-key :status) (s/maybe s/Str)
   :user-key s/Str
   :reason s/Str
   :decider s/Str
   :muutoshakemusUrl s/Str
   (s/optional-key :status-sisaltomuutos) (s/maybe s/Str)
   (s/optional-key :paatos-hyvaksytty-paattymispaiva) (s/maybe java.time.LocalDate)
   (s/optional-key :status-jatkoaika) (s/maybe s/Str)
   (s/optional-key :talousarvio) (s/maybe [va-schema/Meno])
   (s/optional-key :status-talousarvio) (s/maybe s/Str)
   :created-at s/Inst
   :updated-at s/Inst})

(s/defschema MuutoshakemuksenVaatimaKentta
  {:id s/Str
   (s/optional-key :label) (s/maybe s/Str)})

(s/defschema OnkoMuutoshakukelpoinenAvustushakuOk
  {:is-ok s/Bool
   :ok-fields [MuutoshakemuksenVaatimaKentta]
   :erroneous-fields [MuutoshakemuksenVaatimaKentta]})

 (s/defschema MuutoshakemusPaatosRequest
   "Muutoshakemus paatos"
   {:reason s/Str
    (s/optional-key :haen-sisaltomuutosta) (s/maybe {
      :status s/Str
    })
    (s/optional-key :haen-kayttoajan-pidennysta) (s/maybe {
      (s/optional-key :paattymispaiva) (s/maybe java.time.LocalDate)
      :status s/Str
    })
    (s/optional-key :talousarvio) (s/maybe {
      :talousarvio TalousarvioMuutos
      :status s/Str
    })
    })

(s/defschema DbEmail
  "Email stored in database"
  {:formatted s/Str
   :to-address [s/Str]
   (s/optional-key :subject) (s/maybe s/Str)
   (s/optional-key :reply-to) (s/maybe s/Str)
   :bcc (s/maybe s/Str)})

(s/defschema DbEmails
  "Emails stored in database"
   [DbEmail])

(s/defschema PersonScoreAverage
  "Averga score by person"
  {:person-oid s/Str
   :first-name s/Str
   :last-name s/Str
   :email (s/maybe s/Str)
   :score-average s/Num})

(s/defschema Scoring
  "Scoring aggregate data for arvio"
  {:arvio-id s/Int
   :score-total-average s/Num
   :score-averages-by-user [PersonScoreAverage]})

(s/defschema Oppilaitokset
  "Names of oppilaitokset"
  {:names [s/Str]})

(s/defschema ArvioRole
  "Role for arvio"
  {:evaluators [Long]})

(s/defschema Tag
  "Tags for arvio"
  {:value [s/Str]})

(s/defschema Arvio
  "Arvio contains evaluation of hakemus"
  {:id s/Int
   :status ArvioStatus
   :overridden-answers soresu-schema/Answers
   :seuranta-answers soresu-schema/Answers
   :budget-granted s/Int
   :costsGranted s/Int
   :useDetailedCosts s/Bool
   :roles ArvioRole
   :tags Tag
   :oppilaitokset Oppilaitokset
   (s/optional-key :presenter-role-id) (s/maybe Long)
   (s/optional-key :scoring) (s/maybe Scoring)
   (s/optional-key :summary-comment) (s/maybe s/Str)
   (s/optional-key :rahoitusalue) (s/maybe s/Str)
   (s/optional-key :talousarviotili) (s/maybe s/Str)
   (s/optional-key :academysize) (s/maybe s/Int)
   (s/optional-key :perustelut) (s/maybe s/Str)
   (s/optional-key :presentercomment) (s/maybe s/Str)
   (s/optional-key :changelog) (s/maybe s/Any)
   (s/optional-key :allow-visibility-in-external-system) (s/maybe s/Bool)
   (s/optional-key :should-pay) (s/maybe s/Bool)
   (s/optional-key :should-pay-comments) (s/maybe s/Str)})

(s/defschema NewComment
  "New comment to be added"
  {:comment s/Str})

(s/defschema ChangeRequestEmail
  "Change request email"
  {:text s/Str})

(s/defschema SelvitysEmail
  "Loppu/Valiselvitys email"
  {:message s/Str
   :to [(s/one soresu-schema/Email "email") soresu-schema/Email]
   :subject s/Str
   :selvitys-hakemus-id Long})

(s/defschema Comment
  "Contains comment about hakemus"
  {:id Long
   :arvio_id Long
   :created_at s/Inst
   :first_name s/Str
   :last_name s/Str
   :email (s/maybe s/Str)
   :comment s/Str
   (s/optional-key :person_oid) (s/maybe s/Str)})

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
   :email (s/maybe s/Str)
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
                      :language s/Str
                      :status va-schema/HakemusStatus
                      :status-comment (s/maybe s/Str)
                      :user-first-name (s/maybe s/Str)
                      :user-last-name (s/maybe s/Str)
                      (s/optional-key :user-oid) (s/maybe s/Str)
                      (s/optional-key :arvio)  Arvio
                      :budget-total s/Int
                      :budget-oph-share s/Int
                      :register-number (s/maybe s/Str)
                      :user-key s/Str
                      :status-loppuselvitys (s/maybe s/Str)
                      :status-valiselvitys (s/maybe s/Str)
                      :status-muutoshakemus (s/maybe s/Str)
                      :loppuselvitys-information-verified-by (s/maybe s/Str)
                      :loppuselvitys-information-verified-at (s/maybe s/Inst)
                      :loppuselvitys-taloustarkastanut-name (s/maybe s/Str)
                      :loppuselvitys-taloustarkastettu-at (s/maybe s/Inst)
                      :loppuselvitys-information-verification (s/maybe s/Str)
                      :selvitys-email (s/maybe s/Str)
                      :answers [soresu-schema/Answer]
                      (s/optional-key :submitted-version) (s/maybe s/Int)
                      (s/optional-key :refused) (s/maybe s/Bool)
                      (s/optional-key :refused-comment) (s/maybe s/Str)
                      (s/optional-key :refused-at) (s/maybe s/Inst)})

(s/defschema RoleType
  (s/enum "presenting_officer" "evaluator" "vastuuvalmistelija"))

(s/defschema NewRole {:name s/Str
                      :email (s/maybe s/Str)
                      :role (s/maybe RoleType)
                      :oid s/Str})

(s/defschema Role {:id s/Int
                   :name s/Str
                   :email (s/maybe s/Str)
                   :role RoleType
                   :oid (s/maybe s/Str)})

(s/defschema HakuPrivileges
  "Privileges that curently logged in user has for certain avustushaku"
  {:edit-haku s/Bool
   :edit-my-haku-role s/Bool
   :score-hakemus s/Bool
   :change-hakemus-state s/Bool})

(s/defschema Menoluokka
  "Menoluokka description for avustushaku"
  {:type s/Str
   :translation-fi (s/maybe s/Str)
   :translation-sv (s/maybe s/Str)})

(s/defschema VACodeValue
  "VA Code Value"
  {:id s/Int
   :value-type s/Str
   :year s/Int
   :code s/Str
   :code-value s/Str
   (s/optional-key :hidden) (s/maybe s/Bool)})

(s/defschema CreateVACodeValue
  "Create VA Code Value"
  {:value-type s/Str
   :year s/Int
   :code s/Str
   :code-value s/Str})

(s/defschema VACodeValueEdit
  "VA Code Value Edit"
  {:hidden s/Bool})

(s/defschema HakuData
  "Avustushaku structured response with related form, roles, hakemukset etc"
  {:avustushaku va-schema/AvustusHaku
   :environment va-schema/Environment
   :form {:content s/Any
          :rules s/Any}
   :roles [Role]
   :privileges HakuPrivileges
   :hakemukset [Hakemus]
   :attachments s/Any
   :budget-total-sum s/Int
   :budget-oph-share-sum s/Int
   :budget-granted-sum s/Int
   (s/optional-key :operation-id) (s/maybe s/Int)
   (s/optional-key :operational-unit-id) (s/maybe s/Int)
   (s/optional-key :toimintayksikko) (s/maybe VACodeValue)
   (s/optional-key :project-id) (s/maybe s/Int)
   (s/optional-key :talousarvio) (s/maybe [Menoluokka])})

(s/defschema PaatosData
  "Decision response with related avustushaku, form, roles, hakemus"
  {:avustushaku va-schema/AvustusHaku
   :form {:content s/Any
          :rules s/Any}
   :roles [Role]
   (s/optional-key :ispublic) (s/maybe s/Bool)
   :hakemus Hakemus})

(s/defschema SavedSearch
  "Saved search listing certain hakemukset by ids or possibly dynamic search in the future"
  {:hakemus-ids (s/maybe [Long])})

(s/defschema VaUserSearchResult
  "Single person entity from VA user search"
  {:person-oid s/Str
   :first-name (s/maybe s/Str)
   :surname (s/maybe s/Str)
   :email (s/maybe s/Str)
   :lang s/Str
   :privileges [s/Str]})

(s/defschema VaUserSearchResults
  "Complete results of VA user search"
  {:results [VaUserSearchResult]})

(s/defschema UserInUserCache
  {:person-oid s/Str
   :first-name (s/maybe s/Str)
   :surname (s/maybe s/Str)
   :email (s/maybe s/Str)
   :lang s/Str
   :privileges [s/Str]
   })

(s/defschema PopulateUserCachePayload
  [UserInUserCache])

(s/defschema AvustushakuOrganizationNameQuery
  "Find avustushaut by organization name (minimum string length: 3)"
  (s/conditional (fn [s] (> (count s) 2)) s/Str))

(s/defschema PaymentStatus
  "Payment status"
  (s/enum "created" "waiting" "sent" "paid"))

(s/defschema Payment
  "Payment"
  {(s/optional-key :id) s/Int
   (s/optional-key :version) s/Int
   (s/optional-key :version-closed) (s/maybe s/Inst)
   (s/optional-key :created-at) s/Inst
   :application-id  s/Int
   (s/optional-key :application-version) s/Int
   :paymentstatus-id PaymentStatus
   (s/optional-key :filename) (s/maybe s/Str)
   (s/optional-key :pitkaviite) (s/maybe s/Str)
   (s/optional-key :user-name) s/Str
   (s/optional-key :batch-id) (s/maybe s/Int)
   :phase (s/maybe s/Int)
   :payment-sum s/Int})

(s/defschema SimplePayment
  "Simple payment"
  {:paymentstatus-id PaymentStatus})

(s/defschema GrantPayment
  "Grant Payment (for creating grant payments)"
  {:phase s/Int})

(s/defschema GrantStatus
  "Grant status"
  (s/enum "new" "draft" "published" "deleted", "resolved"))

(s/defschema GrantType
  "Grant type"
  (s/enum "yleisavustus" "erityisavustus"))

(s/defschema Grant
  "Grant (avustushaku) schema"
  {:id s/Int
   :created-at s/Inst
   :form s/Int
   (s/optional-key :content) s/Any
   :status GrantStatus
   :register-number (s/maybe s/Str)
   (s/optional-key :decision) s/Any
   :valiselvitysdate (s/maybe LocalDate)
   :loppuselvitysdate (s/maybe LocalDate)
   :form-loppuselvitys (s/maybe s/Int)
   :form-valiselvitys (s/maybe s/Int)
   :is-academysize s/Bool
   :haku-type GrantType
   :allow-visibility-in-external-system s/Bool
   (s/optional-key :arvioitu-maksupaiva) (s/maybe LocalDate)
   (s/optional-key :operational-unit-id) (s/maybe s/Int)
   (s/optional-key :operational-unit) (s/maybe s/Str)
   (s/optional-key :project-id) (s/maybe s/Int)
   (s/optional-key :project) (s/maybe s/Str)
   (s/optional-key :operation-id) (s/maybe s/Int)
   (s/optional-key :operation) (s/maybe s/Str)})

(s/defschema Grants
  "List of grants"
  [Grant])

(s/defschema Application
  "Grant application"
  {:id s/Int
   :created-at s/Inst
   :version s/Int
   :budget-total s/Int
   :budget-oph-share s/Int
   :organization-name s/Str
   :project-name s/Str
   :register-number (s/maybe s/Str)
   (s/optional-key :parent-id) (s/maybe s/Int)
   :language s/Str
   (s/optional-key :status) (s/maybe ArvioStatus)
   (s/optional-key :should-pay) (s/maybe s/Bool)
   (s/optional-key :budget-granted) s/Int
   (s/optional-key :costs-granted) s/Int
   (s/optional-key :lkp-account) (s/maybe s/Str)
   (s/optional-key :takp-account) (s/maybe s/Str)
   (s/optional-key :grant-id) s/Int
   (s/optional-key :evaluation) s/Any
   (s/optional-key :answers) [soresu-schema/Answer]
   (s/optional-key :payment-decisions) (s/maybe [{:id s/Int :payment-sum s/Int
                                         :takp-account s/Str}])
   (s/optional-key :refused) (s/maybe s/Bool)
   (s/optional-key :refused-comment) (s/maybe s/Str)
   (s/optional-key :refused-at) (s/maybe s/Inst)
   (s/optional-key :grant-name) (s/maybe s/Str)})

(s/defschema PaymentBatch
  "Payment batch"
  {(s/optional-key :created-at) s/Inst
   (s/optional-key :id) s/Int
   (s/optional-key :batch-number) s/Int
   :invoice-date LocalDate
   :due-date LocalDate
   :receipt-date LocalDate
   :currency s/Str
   :partner s/Str
   :grant-id s/Int})

(s/defschema BatchDocument
  "Payment batch document"
  {(s/optional-key :created-at) s/Inst
   (s/optional-key :id) s/Int
   :document-id s/Str
   :phase s/Int
   :presenter-email s/Str
   :acceptor-email s/Str
})

(s/defschema PaymentsCreateResult
  "Payment create result"
  {:success s/Bool :errors [s/Any]})

(s/defschema HealthCheckResult
  "Integration healthcheck result"
  {:integrations [{:timestamp s/Str
                   :success s/Bool
                   :error s/Str
                   :service s/Str
                   :valid s/Bool}]
   :current-timestamp s/Str})

(s/defschema YearlyReport
  "Grants report"
  [{:year s/Int
    :count s/Int}])

(s/defschema IncompleteLocalizedString
  "Localized string that might be missing a key"
  {(s/optional-key :fi) s/Str
   (s/optional-key :sv) s/Str})

(s/defschema ExternalHanke
             "Hankkeen tiedot ulkopuolisia järjestelmiä varten"
             {:project-name (s/maybe s/Str)
              :grant-start (s/maybe s/Str)
              :grant-decision-date (s/maybe s/Str)
              :grant-id s/Int
              :organization-name (s/maybe s/Str)
              :budget-total (s/maybe s/Int)
              :id s/Int
              :grant-end (s/maybe s/Str)
              :grant-name (s/maybe {:fi (s/maybe s/Str)
                                    :sv (s/maybe s/Str)})
              :budget-oph-share (s/maybe s/Int)
              :register-number (s/maybe s/Str)})

(s/defschema ExternalGrant
  "Avustushaun tiedot ulkopuolisia järjestelmiä varten"
  {:id s/Int
   :form-loppuselvitys s/Any
   :content s/Any
   :valiselvitysdate (s/maybe LocalDate)
   :operation-id s/Any
   :is-academysize s/Bool
   :haku-type s/Any
   :form-valiselvitys s/Any
   :form s/Any
   :project-id s/Any
   :phase va-schema/HakuPhase
   :status GrantStatus
   :operational-unit-id s/Any
   :register-number (s/maybe s/Str)
   :loppuselvitysdate (s/maybe LocalDate)
   :valmistelija (s/maybe IncompleteLocalizedString)
   :hankkeen-alkamispaiva (s/maybe LocalDate)
   :hankkeen-paattymispaiva (s/maybe LocalDate)
   :created-at s/Inst})

(s/defschema ExternalApplication
  "Hakemuksen tiedot ulkopuolisia järjestelmiä varten"
  {:id s/Int
   :language s/Str
   :grant-id s/Int
   :project-name s/Str
   :organization-name s/Str
   :user-first-name (s/maybe s/Str)
   :user-last-name (s/maybe s/Str)
   :nutshell (s/maybe s/Str)
   :partners (s/maybe s/Str)
   :project-begin (s/maybe s/Str)
   :project-end (s/maybe s/Str)
   :budget-granted (s/maybe s/Int)
   :costs-granted (s/maybe s/Int)})

(s/defschema RaportointivelvoiteData
  {:raportointilaji s/Str
   :maaraaika java.time.LocalDate
   :asha-tunnus s/Str
   :lisatiedot (s/maybe s/Str)})

(s/defschema Raportointivelvoite
  (assoc RaportointivelvoiteData
         :id s/Int))

(s/defschema Lainsaadanto
  {:id s/Int
   :name s/Str})

(s/defschema CreateTalousarviotili
  {
  :name s/Str
  :code s/Str
  :year s/Int
  :amount s/Int
 })

(s/defschema Talousarviotili
  (assoc CreateTalousarviotili
        :id s/Int))
