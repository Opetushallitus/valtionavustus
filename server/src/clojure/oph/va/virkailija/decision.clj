(ns oph.va.virkailija.decision
  (:require [clojure.string :as str]
            [clostache.parser :refer [render]]
            [clojure.data.json :as json]
            [compojure.api.sweet :as compojure-api]
            [oph.common.email :as email]
            [oph.va.decision-liitteet :as decision-liitteet]
            [oph.va.virkailija.hakudata :as hakudata]
            [oph.soresu.form.formutil :as formutil]
            [oph.soresu.common.config :refer [feature-enabled?]]
            [clojure.tools.logging :as log]
            [oph.va.virkailija.authorization :as authorization]
            [oph.va.virkailija.kayttosuunnitelma :as ks]
            [oph.va.virkailija.koulutusosio :as koulutusosio]
            [hiccup.core :refer [html]]
            [oph.va.virkailija.payments-data :as payments-data])
  (:import  [java.time.format DateTimeFormatter]))

(defn decision-translation [translations lang translation-key]
  (get-in translations [:paatos (keyword translation-key) lang]))

(defn content-with-paragraphs [content]
  (let [rows (str/split content #"\n")
        rows-list (html [:span (for [row rows] [:p row])])]
    rows-list))

(defn decision-field [decision str-key lang]
  (get-in decision [str-key lang]))

(defn section [title-key content translate create-paragraph]
  (let [content-p  (if create-paragraph (content-with-paragraphs content) content)
        title (translate title-key)]
      (html [:section {:class "section"} [:h2 title] [:div {:class "content"} content-p]])))

(defn optional-section-content [title content translate]
  (if (seq content)
    (section title content translate true)
    ""))

(defn optional-section [decision title key translate lang]
  (let [decision-content (decision-field decision key lang)]
    (optional-section-content title decision-content translate)))

(defn section-translated [title-key content-key translate create-paragraph]
  (section title-key (translate content-key) translate create-paragraph))

(defn asia-section [avustushaku-name translate]
  (let [content [:span [:p (str (translate :asia-title))] [:p avustushaku-name]]]
  (section :asia content translate false)))

(defn generate-payment-decision [{:keys [grant application translate]}]
  (let [answers-value {:value (:answers application)}
        payment-sum (payments-data/get-first-payment-sum application grant)]
    [:span
     [:span
      [:p (translate "avustus-maksetaan") ":"]
      [:p
       [:strong
        (formutil/find-answer-value answers-value "bank-iban")
        ", "
        (formutil/find-answer-value answers-value "bank-bic")]]]
     [:p
      (translate "maksuerat-ja-ajat") ": "
      (ks/format-number payment-sum) " "
      (decision-field
        (:decision grant) :maksu (keyword (:language application)))
      (if (not= payment-sum (get-in application [:arvio :budget-granted]))
        (str " " (translate :ja-loppuera-viimeistaan)
             " " (get-in grant [:decision :maksudate]))
        ".")]
     (when-some [account (get-in application [:arvio :talousarviotili])]
       [:p
        (translate "talousarviotili") ": " account])]))

(defn avustuksen-maksu [avustushaku hakemus translate]
  (section
    :avustuksen-maksu
    (generate-payment-decision
      {:grant avustushaku
       :application hakemus
       :translate translate})
    translate
    false))


(defn myonteinen-lisateksti [avustushaku hakemus lang]
  (let [rahoitusalue (-> hakemus :arvio :rahoitusalue)
        decision (:decision avustushaku)
        rahoitusalue-key (keyword (str "myonteinenlisateksti-" (if rahoitusalue (str/replace rahoitusalue #"[\s\.]" "_") "")))
        content-rahoitusalue (-> decision rahoitusalue-key lang)
        content-default (decision-field decision :myonteinenlisateksti lang)
        content (if (str/blank? content-rahoitusalue) content-default content-rahoitusalue)
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

(defn get-pakote-liite []
  (let [
         attachment decision-liitteet/PakoteOhjeLiitteet

        ]
  {
    :id (:id attachment)
    :langs (:langs attachment)
    :version ""
   }))

(defn liite-row [liite lang]
 (if-some [liite-id (:id liite)]
   (let [liite-version (:version liite)
         lang-str (name lang)
         link (str "/liitteet/" liite-id liite-version "_" lang-str ".pdf")
         liite-name (get-in liite [:langs lang])]
     (html
       [:div [:a {:href link} liite-name]]))))

(defn non-localized-liite-row [liite lang]
  (if-some [liite-id (:id liite)]
    (let [liite-version (:version liite)
          lang-str (name lang)
          link (str "/liitteet/" liite-id liite-version ".pdf")
          liite-name (get-in liite [:langs lang])]
      (html
       [:div [:a {:href link} liite-name]]))))

(defn liitteet-list [avustushaku hakemus translate lang has-budget]
  (let [liitteet (-> avustushaku :decision :liitteet)
        dont-include-pakote-ohje (-> avustushaku :decision :dont-include-pakote-ohje)
        pakoteohje (if (not dont-include-pakote-ohje)
                     (get-pakote-liite))
        row-pakoteohje (non-localized-liite-row pakoteohje lang)
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
                    (str row-kayttosuunnitelma row-oikaisuvaatimus row-ehdot row-yleisohje row-pakoteohje)
                    (str row-oikaisuvaatimus row-ehdot row-yleisohje row-pakoteohje)))
        content-length (count content)]
        (if (pos? content-length)
          (section :liitteet content translate false)
          "")))

(defn kayttoaika-section [avustushaku translate]
  (let [first-day (.format (:hankkeen-alkamispaiva avustushaku) (DateTimeFormatter/ofPattern "dd.MM.yyyy"))
        last-day (.format (:hankkeen-paattymispaiva avustushaku) (DateTimeFormatter/ofPattern "dd.MM.yyyy"))
        content [:span [:p (str (translate :ensimmainen-kayttopaiva) " " first-day)] [:p (str (translate :viimeinen-kayttopaiva) " " last-day)]]]
    (section :valtionavustuksen-kayttoaika content translate false)))

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
        presenting-officers (filter authorization/is-valmistelija? roles)
        arvio (:arvio hakemus)
        decision-status (:status arvio)
        oppilaitokset (:names (:oppilaitokset arvio))
        accepted (not= decision-status "rejected")
        arvio-role-id (:presenter-role-id arvio)
        arvio-role (first (filter #(= (:id %) arvio-role-id) roles))
        role (if (nil? arvio-role) (first presenting-officers) arvio-role)
        language (keyword (:language hakemus))
        avustushaku-name (get-in avustushaku [:content :name language])
        total-granted (:budget-granted arvio)
        template (email/load-template (str "templates/paatos.html"))
        translations-str (email/load-template "public/translations.json")
        translations (json/read-str translations-str :key-fn keyword)
        translate (partial decision-translation translations language)
        johtaja (decision-field decision :johtaja language)
        valmistelija (decision-field decision :valmistelija language)
        avustuksen-maksu (avustuksen-maksu avustushaku hakemus translate)
        myonteinen-lisateksti (myonteinen-lisateksti avustushaku hakemus language)
        form-content (-> haku-data :form :content)
        kayttosuunnitelma (ks/kayttosuunnitelma avustushaku hakemus form-content answers translate language)
        has-kayttosuunnitelma (and (:has-kayttosuunnitelma kayttosuunnitelma) is-erityisavustus)
        show-oph-financing-percentage (pos? (:self-financing-percentage kayttosuunnitelma))
        oph-financing-percentage (:oph-financing-percentage kayttosuunnitelma)
        liitteet-list (liitteet-list avustushaku hakemus translate language has-kayttosuunnitelma)
        koulutusosio (koulutusosio/koulutusosio hakemus answers translate)
        has-koulutusosio (:has-koulutusosio koulutusosio)
        kayttoaika (if (or (nil? (:hankkeen-alkamispaiva avustushaku)) (nil? (:hankkeen-paattymispaiva avustushaku)))
                    (optional-section decision :valtionavustuksen-kayttoaika :kayttoaika translate language)
                    (kayttoaika-section avustushaku translate))

        params {
                :avustushaku                   avustushaku
                :is-yleisavustus               is-yleisavustus
                :is-erityisavustus             is-erityisavustus
                :hakemus                       hakemus
                :section-asia                  (asia-section avustushaku-name translate)
                :section-taustaa               (optional-section decision :taustaa :taustaa translate language)
                :section-sovelletut-saannokset (optional-section decision :sovelletut-saannokset :sovelletutsaannokset translate language)
                :section-kayttoaika            kayttoaika
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
                :avustuslaji                   (translate avustushaku-type)
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
