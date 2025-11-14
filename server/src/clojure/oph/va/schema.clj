(ns oph.va.schema
  (:require [schema.core :as s]
            [oph.soresu.form.schema :refer :all]))

(create-form-schema ["vaBudget"
                     "vaSummingBudgetElement"
                     "vaBudgetItemElement"
                     "vaBudgetSummaryElement"
                     "vaProjectDescription"]
                    ["vaFocusAreas"
                     "vaEmailNotification"
                     "vaSelfFinancingField"
                     "vaTraineeDayCalculator"]
                    ["vaTraineeDayTotalCalculator" "vaBudgetGrantedElement"])

(s/defschema SystemTime {:system-time s/Inst})

(s/defschema Duration {:label LocalizedString
                       :start s/Inst
                       :end s/Inst})

(s/defschema LocalizedStringList {:label LocalizedString
                                  :items [LocalizedString]})

(defn- is-percentage? [number]
  (and (number? number) (>= number 0) (<= number 100)))

(s/defschema Rahoitusalue {:rahoitusalue s/Str
                           :talousarviotilit [s/Str]})

(s/defschema AvustusHakuContent {:name LocalizedString
                                 :duration Duration
                                 :focus-areas LocalizedStringList
                                 :selection-criteria LocalizedStringList
                                 (s/optional-key :payment-size-limit) s/Str
                                 (s/optional-key :payment-min-first-batch) s/Num
                                 (s/optional-key :payment-fixed-limit) s/Int
                                 (s/optional-key :total-grant-size) s/Int
                                 (s/optional-key :operation) (s/maybe s/Str)
                                 (s/optional-key :operational-unit) (s/maybe s/Str)
                                 ; This :project field is probably not used anymore but exists in the avustushaku content json blob
                                 ; in older avustushakus. That is avustushaku 264 created on 2018-03-27 and earlier.
                                 (s/optional-key :project) (s/maybe s/Str)
                                 (s/optional-key :rahoitusalueet) [Rahoitusalue]
                                 (s/optional-key :multiplemaksuera) s/Bool
                                 (s/optional-key :transaction-account) s/Str
                                 (s/optional-key :document-type) s/Str
                                 :self-financing-percentage (s/conditional is-percentage? s/Num)})

(s/defschema Environment
  {:name s/Str
   :environment (s/maybe s/Str)
   :show-name s/Bool
   :hakija-server {:url LocalizedString}
   :virkailija-server {:url s/Str}
   :paatos-path s/Str
   :notice {:fi s/Str :sv s/Str}
   :feature-flags [s/Keyword]
   (s/optional-key :payments) (s/maybe {(s/optional-key :delete-payments?) s/Bool
                                        (s/optional-key :enabled?) s/Bool})
   (s/optional-key :opintopolku) {:url s/Str
                                  :permission-request s/Str}
   (s/optional-key :application-change)
   (s/maybe {(s/optional-key :refuse-enabled?) s/Bool})
   (s/optional-key :dont-send-loppuselvityspyynto-to-virkailija) (s/maybe {:enabled? s/Bool})})

(s/defschema HakuType
  (s/enum "yleisavustus" "erityisavustus"))

(s/defschema HakuStatus
  (s/enum "new" "draft" "published" "resolved" "deleted"))

(s/defschema HakuPhase
  (s/enum "unpublished" "upcoming" "current" "ended"))

(s/defschema LocalizedStringOptional {(s/optional-key :fi) s/Str
                                      (s/optional-key :sv)  s/Str})

(s/defschema Liite {:group s/Str
                    :id s/Str
                    :version s/Str})

(defn myonteinen-lisateksti-schema-key [rahoitusalue]
  (s/optional-key (keyword (str "myonteinenlisateksti-" rahoitusalue))))

(s/defschema Decision
  "Decision fields"
  {(s/optional-key :date) s/Str
   (s/optional-key :taustaa) LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Varhaiskasvatus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Yleissivistävä_koulutus,_ml__varhaiskasvatus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Esiopetus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Perusopetus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Lukiokoulutus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Taiteen_perusopetus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Ammatillinen_koulutus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Vapaa_sivistystyö") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Kansalaisopisto") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Tiedeolympialaistoiminta") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Suomi-koulut_ja_kotiperuskoulut") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Muut_järjestöt") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Kristillisten_koulujen_kerhotoiminta") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Kansanopisto") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Opintokeskus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Kesäyliopisto") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Korkeakoulutus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Aikuiskoulutus_ja_vapaa_sivistystyö") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Koko_opetustoimi") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Poikkeus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Muut_hakuryhmät") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Muut") LocalizedStringOptional
   (s/optional-key :maksu) LocalizedStringOptional
   (s/optional-key :maksudate) s/Str
   (s/optional-key :kaytto) LocalizedStringOptional
   (s/optional-key :kayttotarkoitus) LocalizedStringOptional
   (s/optional-key :kayttooikeudet) LocalizedStringOptional
   (s/optional-key :selvitysvelvollisuus) LocalizedStringOptional
   (s/optional-key :kayttoaika) LocalizedStringOptional
   (s/optional-key :lisatiedot) LocalizedStringOptional
   (s/optional-key :myonteinenlisateksti) LocalizedStringOptional
   (s/optional-key :sovelletutsaannokset) LocalizedStringOptional
   (s/optional-key :johtaja) LocalizedStringOptional
   (s/optional-key :valmistelija) LocalizedStringOptional
   (s/optional-key :hyvaksyminen) LocalizedStringOptional
   (s/optional-key :liitteet) [Liite]
   (s/optional-key :dont-include-pakote-ohje) s/Bool
   (s/optional-key :updatedAt) s/Str})
(s/defschema AvustusHaku {:id Long
                          :status HakuStatus
                          :phase HakuPhase
                          :haku-type HakuType
                          :is_academysize s/Bool
                          :register-number (s/maybe s/Str)
                          :hallinnoiavustuksia-register-number (s/maybe s/Str)
                          :content AvustusHakuContent
                          (s/optional-key :hankkeen-alkamispaiva) (s/maybe java.time.LocalDate)
                          (s/optional-key :hankkeen-paattymispaiva) (s/maybe java.time.LocalDate)
                          (s/optional-key :loppuselvitysdate) (s/maybe java.time.LocalDate)
                          (s/optional-key :valiselvitysdate) (s/maybe java.time.LocalDate)
                          (s/optional-key :decision) Decision
                          :form Long
                          (s/optional-key :form_loppuselvitys) (s/maybe Long)
                          (s/optional-key :form_valiselvitys) (s/maybe Long)
                          (s/optional-key :operational-unit-id) (s/maybe s/Int)
                          (s/optional-key :operational-unit-code) (s/maybe s/Str)
                          :allow_visibility_in_external_system s/Bool
                          :arvioitu_maksupaiva (s/maybe java.time.LocalDate)
                          :muutoshakukelpoinen s/Bool})

(s/defschema ListingAvustushaku
  "Avustushaku with extra details for avustushaku listing"
  (assoc AvustusHaku
         :vastuuvalmistelija (s/maybe s/Str)
         :paatokset-lahetetty (s/maybe java.sql.Timestamp)
         :maksatukset-lahetetty (s/maybe java.sql.Timestamp)
         :valiselvitykset-lahetetty (s/maybe java.sql.Timestamp)
         :loppuselvitykset-lahetetty (s/maybe java.sql.Timestamp)
         :maksatukset-summa (s/maybe s/Int)
         :use-overridden-detailed-costs (s/maybe s/Bool)))

(s/defschema ArviointiDropdownAvustushaut {:id Long
                                           :name s/Str})

(s/defschema HakemusStatus
  "Status from the applicant point of view"
  (s/enum "new" "draft" "submitted" "pending_change_request"
          "officer_edit" "cancelled" "refused" "applicant_edit"))

(s/defschema Attachment
  "Attachment metadata"
  {:id Long
   :hakemus-id Long
   :version Long
   (s/optional-key :version-closed) s/Inst
   (s/optional-key :created-at) s/Inst
   :field-id s/Str
   :file-size Long
   :content-type s/Str
   :hakemus-version Long
   :filename s/Str})

(s/defschema Meno
  "Meno contains a single menoluokka from talousarvio"
  {:type s/Str
   :amount Long
   :translation-fi s/Str
   :translation-sv (s/maybe  s/Str)})

(s/defschema NormalizedHakemus
  "NormalizedHakemus contains hakemus answers in normalized format"
  {:id Long
   :hakemus-id Long
   :updated-at s/Inst
   :created-at s/Inst
   (s/optional-key :project-name) s/Str
   :contact-person s/Str
   :contact-email s/Str
   :contact-phone s/Str
   :organization-name s/Str
   :register-number s/Str
   (s/optional-key :trusted-contact-name) s/Str
   (s/optional-key :trusted-contact-email) s/Str
   (s/optional-key :trusted-contact-phone) s/Str
   (s/optional-key :talousarvio) [Meno]})

(s/defschema MuutoshakemusStatus
  "Muutoshakemus status"
  (s/enum "new" "accepted" "rejected", "accepted_with_changes"))

(s/defschema Muutoshakemus
  "Muutoshakemus for a specific hakemus"
  {:id Long
   :hakemus-id Long
   :haen-kayttoajan-pidennysta s/Bool
   :kayttoajan-pidennys-perustelut (s/maybe s/Str)
   :haettu-kayttoajan-paattymispaiva (s/maybe java.time.LocalDate)
   :haen-sisaltomuutosta s/Bool
   :sisaltomuutos-perustelut (s/maybe s/Str)
   :talousarvio [Meno]
   :talousarvio-perustelut (s/maybe s/Str)
   :status MuutoshakemusStatus
   :paatos-user-key (s/maybe s/Str)
   (s/optional-key :paatos-hyvaksytty-paattymispaiva) (s/maybe java.time.LocalDate)
   (s/optional-key :paatos-talousarvio) (s/maybe [Meno])
   (s/optional-key :paatos-status-jatkoaika) (s/maybe s/Str)
   (s/optional-key :paatos-status-talousarvio) (s/maybe s/Str)
   (s/optional-key :paatos-status-sisaltomuutos) (s/maybe s/Str)
   (s/optional-key :paatos-reason) (s/maybe s/Str)
   :paatos-created-at (s/maybe s/Inst)
   :paatos-sent-at (s/maybe s/Inst)
   :created-at s/Inst})

(s/defschema HakemusIdList
  "List of hakemus IDs"
  [Long])

(s/defschema MuutoshakemusList
  "Muutoshakemus for a specific hakemus"
  [Muutoshakemus])

(s/defschema VaSubmission {:created_at s/Inst
                           :form Long
                           :version Long
                           :version_closed (s/maybe s/Inst)
                           :answers Answers})
