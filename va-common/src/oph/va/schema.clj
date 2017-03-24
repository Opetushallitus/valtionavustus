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
                                 (s/optional-key :rahoitusalueet) [Rahoitusalue]
                                 (s/optional-key :multiplemaksuera) s/Bool
                                 :self-financing-percentage (s/conditional is-percentage? s/Num)})

(s/defschema Environment {:name s/Str
                          :show-name s/Bool
                          :hakija-server {:url LocalizedString}
                          :virkailija-server {:url s/Str}
                          :paatos-path s/Str
                          (s/optional-key :opintopolku) {:url s/Str
                                                         :permission-request s/Str}})

(s/defschema HakuType
  (s/enum "yleisavustus" "erityisavustus"))

(s/defschema HakuStatus
  (s/enum "new" "draft" "published" "resolved" "deleted"))

(s/defschema HakuPhase
  (s/enum "unpublished" "upcoming" "current" "ended"))

(s/defschema LocalizedStringOptional {
                                      (s/optional-key :fi) s/Str
                                      (s/optional-key :sv)  s/Str})

(s/defschema Liite {
                    :group s/Str
                    :id s/Str
                    }
)

(defn myonteinen-lisateksti-schema-key [rahoitusalue]
  (s/optional-key (keyword (str "myonteinenlisateksti-" rahoitusalue))))

(s/defschema Decision
  "Decision fields"
  {
   (s/optional-key :date) s/Str
   (s/optional-key :taustaa) LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Yleissivistävä_koulutus,_ml__varhaiskasvatus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Ammatillinen_koulutus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Aikuiskoulutus_ja_vapaa_sivistystyö") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Koko_opetustoimi") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Kansalaisopisto") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Kansanopisto") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Opintokeskus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Kesäyliopisto") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Poikkeus") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Tiedeolympialaistoiminta") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Suomi-koulut_ja_kotiperuskoulut") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Muut_järjestöt") LocalizedStringOptional
   (myonteinen-lisateksti-schema-key "Kristillisten_koulujen_kerhotoiminta") LocalizedStringOptional
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
  }
)
(s/defschema AvustusHaku {:id Long
                          :status HakuStatus
                          :phase HakuPhase
                          :haku-type HakuType
                          :is_academysize s/Bool
                          :register-number (s/maybe s/Str)
                          :content AvustusHakuContent
                          (s/optional-key :loppuselvitysdate) (s/maybe s/Str)
                          (s/optional-key :valiselvitysdate) (s/maybe s/Str)
                          (s/optional-key :decision) Decision
                          :form Long
                          (s/optional-key :form_loppuselvitys) (s/maybe Long)
                          (s/optional-key :form_valiselvitys) (s/maybe Long)})

(s/defschema HakemusStatus
  "Status from the applicant point of view"
  (s/enum "new" "draft" "submitted" "pending_change_request" "officer_edit" "cancelled"))

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

(s/defschema VaSubmission {:created_at s/Inst
                           :form Long
                           :version Long
                           :version_closed (s/maybe s/Inst)
                           :answers Answers})
