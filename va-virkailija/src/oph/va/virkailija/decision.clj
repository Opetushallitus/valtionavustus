(ns oph.va.virkailija.decision
  (:require [clojure.string :as str]
            [clostache.parser :refer [render]]
            [clojure.data.json :as json]
            [compojure.api.sweet :refer :all]
            [compojure.core :refer [defroutes GET POST]]
            [oph.common.email :as email]
            [oph.va.virkailija.hakudata :as hakudata]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.virkailija.kayttosuunnitelma :as kayttosuunnitelma]
            [oph.va.virkailija.koulutusosio :as koulutusosio]
            [schema.core :as s]))

(def Liitteet [
                {
                 :group "Ehdot"
                 :attachments [
                              {
                               :id "2a_ehdot_ja_rajoitukset_eritysavustus"
                               :fi "Eritysavustukseen liittyvät ehdot ja rajoitukset"
                               :sv "Villkor och begränsningar för specialunderstöd "
                               }
                              {
                               :id "2b_ehdot_ja_rajoitukset_yleisavustus"
                               :fi "Yleisavustukseen liittyvät ehdot ja rajoitukset"
                               :sv "Villkor och begränsningar för allmänt understöd "
                               }
                              ]
                 }
                {
                 :group "Oikaisuvaatimusosoitus"
                 :attachments [
                              {
                               :id "3a_oikaisuvaatimusosoitus_valtionavustuslaki"
                               :fi "Oikaisuvaatimusosoitus"
                               :sv "Rättelseyrkande"
                               }
                              {
                               :id "3b_oikaisuvaatimusosoitus_laki_vapaasta_sivistystyosta"
                               :fi "Oikaisuvaatimusosoitus"
                               :sv "Rättelseyrkande"
                               }
                              {
                               :id "3c_oikaisuvaatimusosoitus_laki_opetus_ja_kulttuuritoimen_rahoituksesta"
                               :fi "Oikaisuvaatimusosoitus"
                               :sv "Rättelseyrkande"
                               }
                              ]
                 }
                {
                 :group "Valtionavustusten yleisohje"
                 :attachments [
                              {
                               :id "va_yleisohje"
                               :fi "Valtionavustusten yleisohje"
                               :sv "Allmänna anvisningar om statsunderstöd"
                               }
                              ]
                }
               ])


(defn decision-translation [translations lang keyword-or-key]
  (let [key (if (keyword? keyword-or-key) keyword-or-key (keyword keyword-or-key))]
    (-> translations :paatos key lang)))


(defn content-with-paragraphs [content]
  (let [rows (str/split content #"\n")
        rows-list (mapv (fn [row] (str "<p>" row "</p>")) rows)
        rows-p (str/join " " rows-list)]
    rows-p))

(defn decision-field [decision key lang]
  (-> decision key lang))

(defn section [title-key content translate create-paragraph]
  (let [content-p  (if create-paragraph (content-with-paragraphs content) content)
        title (translate title-key)]
    (str "<section class='section'><h2>" title "</h2><div class='content'>" content-p "</div></section>")))

(defn optional-section-content [title content translate]
  (let [content-length (count content)]
    (if (> content-length 0)
      (section title content translate true)
      "")))

(defn optional-section [decision title key translate lang]
  (let [decision-content (decision-field decision key lang)]
    (optional-section-content title decision-content translate)))

(defn section-translated [title-key content-key translate create-paragraph]
  (section title-key (translate content-key) translate create-paragraph))

(defn asia-section [avustushaku-name translate]
  (let [content (str "<p>" (translate :asia-title) "</p>\n"
                     "<p>" avustushaku-name "</p>\n")]
    (section :asia content translate false)))

(defn avustuksen-maksu [avustushaku bic iban total-paid lang translate]
  (let [decision (:decision avustushaku)
        maksu-date (:maksudate decision)
        maksu (decision-field decision :maksu lang)
        has-multiple-maksuera (-> avustushaku :content :multiplemaksuera)
        multiple-maksuera (and has-multiple-maksuera (> total-paid 60000))
        first-round-paid (if multiple-maksuera (Math/round (* 0.6 total-paid)) total-paid)
        paid-formatted (kayttosuunnitelma/format-number first-round-paid)
        extra-no-multiple "<span>.</span>"
        extra-multiple (str "<span> " (translate :ja-loppuera-viimeistaan) " " maksu-date ".</span>")
        extra (if multiple-maksuera extra-multiple extra-no-multiple)
        content1 (str "<p>" (translate "avustus-maksetaan") ":</p><p><strong>" iban ", " bic "</strong>" "</p>")
        content2 (str "<p>" (translate "maksuerat-ja-ajat") ": " paid-formatted " " maksu extra "</p>")
        content (str content1 content2)]
    (section :avustuksen-maksu content translate false)))

(defn myonteinen-lisateksti [avustushaku hakemus lang]
  (let [multiple-rahoitusalue (:multiple-rahoitusalue avustushaku)
        rahoitusalue (-> hakemus :arvio :rahoitusalue)
        decision (:decision avustushaku)
        rahoitusalue-key (keyword (str "myonteinenlisateksti-" rahoitusalue))
        content-rahoitusalue (-> decision rahoitusalue-key lang)
        content-default (decision-field decision :myonteinenlisateksti lang)
        content (if (and multiple-rahoitusalue content-rahoitusalue) content-rahoitusalue content-default)
        ]
    (if content
      (content-with-paragraphs content)
      "")))


(defn find-liite [all-attachements attachements group-name]
  (let [row (first (filter #(= (:group %) group-name) attachements))
        group (first (filter #(= (:group %) group-name) all-attachements))
        row-id (:id row)
        group-attachments (:attachments group)
        attachment (first (filter #(= (:id %) row-id) group-attachments))
        ]
    attachment))

(defn liite-row [liite lang]
  (let [liite-id (:id liite)
        lang-str (name lang)
        link (str "/liitteet/" liite-id "_" lang-str ".pdf")
        liite-name (lang liite)]
    (if (not-empty liite-id)
      (str "<div><a href='" link "'>" liite-name "</a></div>")
      "")))

(defn liitteet-list [avustushaku hakemus translate lang has-budget]
  (let [all-liitteet Liitteet
        liitteet (-> avustushaku :decision :liitteet)
        decision-status (-> hakemus :arvio :status)
        rejected (= decision-status "rejected")
        ehdot (find-liite all-liitteet liitteet "Ehdot")
        oikaisuvaatimus (find-liite all-liitteet liitteet "Oikaisuvaatimusosoitus")
        yleisohje (find-liite all-liitteet liitteet "Valtionavustusten yleisohje")
        row-kayttosuunnitelma (str "<div>" (translate :kayttosuunnitelma) "</div>")
        row-oikaisuvaatimus (liite-row oikaisuvaatimus lang)
        row-ehdot (liite-row ehdot lang)
        row-yleisohje (liite-row yleisohje lang)
        content (if rejected
                  row-oikaisuvaatimus
                  (if has-budget
                    (str row-kayttosuunnitelma row-oikaisuvaatimus row-ehdot row-yleisohje)
                    (str row-oikaisuvaatimus row-ehdot row-yleisohje)))
        content-length (count content)]
        (if (> content-length 0)
          (section :liitteet content translate false)
          "")))

(defn paatos-html [hakemus-id lang]
  (let [haku-data (hakudata/get-combined-paatos-data hakemus-id)
        avustushaku (:avustushaku haku-data)
        avustushaku-type (:haku-type avustushaku)
        is-yleisavustus (= avustushaku-type "yleisavustus")
        is-erityisavustus (= avustushaku-type "erityisavustus")
        decision (:decision avustushaku)
        hakemus (:hakemus haku-data)
        answers-field (:answers hakemus)
        answers {:value answers-field}
        roles (:roles haku-data)
        presenting-officers (filter #(= (:role %) "presenting_officer") roles)
        arvio (:arvio hakemus)
        decision-status (:status arvio)
        oppilaitokset (:names (:oppilaitokset arvio))
        accepted (not= decision-status "rejected")
        arvio-role-id (:presenter-role-id arvio)
        arvio-role (first (filter #(= (:id %) arvio-role-id) roles))
        self-financing-percentage (-> avustushaku :content :self-financing-percentage)
        oph-financing-percentage (- 100 self-financing-percentage)
        role (if (nil? arvio-role) (first presenting-officers) arvio-role)
        language-answer (formutil/find-answer-value answers "language")
        language (if lang
                   (keyword lang)
                   (if (nil? language-answer) :fi
                                              (keyword language-answer)))
        avustushaku-name (get-in avustushaku [:content :name language])
        iban (formutil/find-answer-value answers "bank-iban")
        bic (formutil/find-answer-value answers "bank-bic")
        total-granted (:budget-granted arvio)
        template (email/load-template (str "templates/paatos.html"))
        translations-str (email/load-template "public/translations.json")
        translations (json/read-str translations-str :key-fn keyword)
        translate (partial decision-translation translations language)
        johtaja (decision-field decision :johtaja language)
        valmistelija (decision-field decision :valmistelija language)
        avustuksen-maksu (avustuksen-maksu avustushaku bic iban total-granted language translate)
        myonteinen-lisateksti (myonteinen-lisateksti avustushaku hakemus language)
        form-content (-> haku-data :form :content)
        kayttosuunnitelma (kayttosuunnitelma/kayttosuunnitelma avustushaku hakemus form-content answers translate language)
        has-kayttosuunnitelma (and (:has-kayttosuunnitelma kayttosuunnitelma) is-erityisavustus)
        liitteet-list (liitteet-list avustushaku hakemus translate language has-kayttosuunnitelma)
        koulutusosio (koulutusosio/koulutusosio hakemus answers translate)
        has-koulutusosio (:has-koulutusosio koulutusosio)

        params {
                :avustushaku                   avustushaku
                :is-yleisavustus               is-yleisavustus
                :is-erityisavustus             is-erityisavustus
                :hakemus                       hakemus
                :section-asia                  (asia-section avustushaku-name translate)
                :section-taustaa               (optional-section decision :taustaa :taustaa translate language)
                :section-sovelletut-saannokset (optional-section decision :sovelletut-saannokset :sovelletutsaannokset translate language)
                :section-kayttoaika            (optional-section decision :valtionavustuksen-kayttoaika :kayttoaika translate language)
                :section-kayttotarkoitus       (optional-section decision :avustuksen-kayttotarkoitus :kayttotarkoitus translate language)
                :section-selvitysvelvollisuus  (optional-section decision :selvitysvelvollisuus :selvitysvelvollisuus translate language)
                :section-kayttooikeudet        (optional-section decision :kayttooikeudet :kayttooikeudet translate language)
                :section-hyvaksyminen          (optional-section decision :hyvaksyminen :hyvaksyminen translate language)
                :section-perustelut            (optional-section-content :paatoksen-perustelut (:perustelut arvio) translate)
                :section-tarkastusoikeus       (section-translated :tarkastusoikeus-title :tarkastusoikeus-text translate false)
                :section-avustuksen-maksu      avustuksen-maksu
                :total-granted                 (kayttosuunnitelma/format-number total-granted)
                :total-nettomenot              (kayttosuunnitelma/format-number (:nettomenot-yhteensa kayttosuunnitelma))
                :role                          role
                :t                             translate
                :johtaja                       johtaja
                :valmistelija                  valmistelija
                :myonteinen-lisateksti         myonteinen-lisateksti
                :liitteet                      liitteet-list
                :accepted                      accepted
                :rejected                      (not accepted)
                :oph-financing-percentage      oph-financing-percentage
                :show-financing-percentage     (> self-financing-percentage 0)
                :has-kayttosuunnitelma         has-kayttosuunnitelma
                :kayttosuunnitelma             (:body kayttosuunnitelma)
                :koulutusosio                  (:body koulutusosio)
                :has-koulutusosio              has-koulutusosio
                :oppilaitokset                 oppilaitokset
                }
        body (render template params)]
    body))

(defroutes* decision-routes
            "Decision"

            (GET* "/avustushaku/:avustushaku-id/hakemus/:hakemus-id" []
                  :path-params [avustushaku-id :- Long hakemus-id :- Long]
                  :query-params [{lang :- s/Str nil}]
                  (let [body (paatos-html hakemus-id lang)]
                    {:status  200
                     :headers {"Content-Type" "text/html"}
                     :body    body})))
