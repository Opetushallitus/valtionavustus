(ns oph.va.virkailija.decision
  (:require [clojure.string :as str]
            [clostache.parser :refer [render]]
            [clojure.data.json :as json]
            [compojure.api.sweet :as compojure-api]
            [oph.common.email :as email]
            [oph.va.decision-liitteet :as decision-liitteet]
            [oph.va.virkailija.hakudata :as hakudata]
            [oph.soresu.form.formutil :as formutil]
            [oph.va.virkailija.kayttosuunnitelma :as ks]
            [oph.va.virkailija.koulutusosio :as koulutusosio]
            [schema.core :as s]
            [hiccup.core :refer [html]]))

(defn decision-translation [translations lang keyword-or-key]
  (let [key (if (keyword? keyword-or-key) keyword-or-key (keyword keyword-or-key))]
    (-> translations :paatos key lang)))

(defn content-with-paragraphs [content]
  (let [rows (str/split content #"\n")
        rows-list (mapv (fn [row]  (html [:p row])) rows)
        rows-p (str/join " " rows-list)]
    rows-p))

(defn decision-field [decision key lang]
  (-> decision key lang))

(defn section [title-key content translate create-paragraph]
  (let [content-p  (if create-paragraph (content-with-paragraphs content) content)
        title (translate title-key)]
      (html [:section {:class "section"} [:h2 title] [:div {:class "content"} content-p]])))

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
  (let [content [:span [:p (str (translate :asia-title))] [:p avustushaku-name]]]
  (section :asia content translate false)))

(defn avustuksen-maksu [avustushaku bic iban total-paid lang translate arvio]
  (let [decision (:decision avustushaku)
        maksu-date (:maksudate decision)
        maksu (decision-field decision :maksu lang)
        has-multiple-maksuera (-> avustushaku :content :multiplemaksuera)
        multiple-maksuera (and has-multiple-maksuera (> total-paid 60000))
        first-round-paid (if multiple-maksuera (Math/round (* 0.6 total-paid)) total-paid)
        paid-formatted (ks/format-number first-round-paid)
        extra-no-multiple "."
        extra-multiple [:span (str  (translate :ja-loppuera-viimeistaan) "" maksu-date)]
        extra (if multiple-maksuera extra-multiple extra-no-multiple)
        content1 [:span [:p (str (translate "avustus-maksetaan") ":")] [:p [:strong (str iban ", " bic)]]]
        content2 [:p (str (translate "maksuerat-ja-ajat") ": " paid-formatted " " maksu extra)]
        content3 (when-not (nil? (:talousarviotili arvio)) [:p (str (translate "talousarviotili") ": " (:talousarviotili arvio))])
        content [:span content1 content2 content3]]
    (section :avustuksen-maksu content translate false)))


(defn myonteinen-lisateksti [avustushaku hakemus lang]
  (let [rahoitusalueet (-> avustushaku :content :rahoitusalueet)
        rahoitusalue (-> hakemus :arvio :rahoitusalue)
        decision (:decision avustushaku)
        rahoitusalue-key (keyword (str "myonteinenlisateksti-" (if rahoitusalue (str/replace rahoitusalue #"[\s\.]" "_") "")))
        content-rahoitusalue (-> decision rahoitusalue-key lang)
        content-default (decision-field decision :myonteinenlisateksti lang)
        content (if (and (some some? rahoitusalueet) content-rahoitusalue) content-rahoitusalue content-default)
        ]
    (if content
      (content-with-paragraphs content)
      "")))


(defn find-liite [attachments group-name]
  (let [row (first (filter #(= (:group %) group-name) attachments))
        group (first (filter #(= (:group %) group-name) decision-liitteet/Liitteet))
        row-id (:id row)
        attachment (first (filter #(= (:id %) row-id) (:attachments group)))]
    {:id      row-id
     :langs   (:langs attachment)
     :version (:version row)}))

(defn liite-row [liite lang]
 (if-some [liite-id (:id liite)]
   (let [liite-version (:version liite)
         lang-str (name lang)
         link (str "/liitteet/" liite-id liite-version "_" lang-str ".pdf")
         liite-name (get-in liite [:langs lang])]
     (html
       [:div [:a {:href link} liite-name]]))))

(defn liitteet-list [avustushaku hakemus translate lang has-budget]
  (let [liitteet (-> avustushaku :decision :liitteet)
        decision-status (-> hakemus :arvio :status)
        rejected (= decision-status "rejected")
        ehdot (find-liite liitteet "Ehdot")
        oikaisuvaatimus (find-liite liitteet "Oikaisuvaatimusosoitus")
        yleisohje (find-liite liitteet "Valtionavustusten yleisohje")
        row-kayttosuunnitelma (html [:div (str (translate :kayttosuunnitelma))])
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

(defn paatos-html [hakemus-id]
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
        role (if (nil? arvio-role) (first presenting-officers) arvio-role)
        language (keyword (:language hakemus))
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
        avustuksen-maksu (avustuksen-maksu avustushaku bic iban total-granted language translate arvio)
        myonteinen-lisateksti (myonteinen-lisateksti avustushaku hakemus language)
        form-content (-> haku-data :form :content)
        kayttosuunnitelma (ks/kayttosuunnitelma avustushaku hakemus form-content answers translate language)
        has-kayttosuunnitelma (and (:has-kayttosuunnitelma kayttosuunnitelma) is-erityisavustus)
        show-oph-financing-percentage (> (:self-financing-percentage kayttosuunnitelma) 0)
        oph-financing-percentage (:oph-financing-percentage kayttosuunnitelma)
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
                :total-granted                 (ks/format-number total-granted)
                :total-nettomenot              (ks/format-number (:nettomenot-yhteensa kayttosuunnitelma))
                :role                          role
                :t                             translate
                :johtaja                       johtaja
                :valmistelija                  valmistelija
                :myonteinen-lisateksti         myonteinen-lisateksti
                :liitteet                      liitteet-list
                :accepted                      accepted
                :rejected                      (not accepted)
                :show-oph-financing-percentage show-oph-financing-percentage
                :oph-financing-percentage      (ks/format-decimal oph-financing-percentage)
                :has-kayttosuunnitelma         has-kayttosuunnitelma
                :kayttosuunnitelma             (:body kayttosuunnitelma)
                :koulutusosio                  (:body koulutusosio)
                :has-koulutusosio              has-koulutusosio
                :oppilaitokset                 oppilaitokset
                }
        body (render template params)]
    body))

(compojure-api/defroutes decision-routes
  "Decision"

  (compojure-api/GET "/avustushaku/:avustushaku-id/hakemus/:hakemus-id" []
    :path-params [avustushaku-id :- Long hakemus-id :- Long]
    (let [body (paatos-html hakemus-id)]
      {:status  200
       :headers {"Content-Type" "text/html"}
       :body    body})))
