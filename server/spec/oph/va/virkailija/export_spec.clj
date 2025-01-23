(ns oph.va.virkailija.export-spec
  (:require [speclj.core :refer :all]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [clojure.string :as string]
            [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.va.virkailija.export :as export])
  (:import [java.io ByteArrayInputStream]
           [org.apache.poi.ss.usermodel Cell CellType Sheet]))

(defn- rand-string [chars n]
  (->> #(rand-nth chars)
       repeatedly
       (take n)
       (apply str)))

(defn- read-edn-input [input]
  (with-open [r (io/reader input)]
    (edn/read (java.io.PushbackReader. r))))

(defn- read-edn-resource [path]
  (read-edn-input (io/resource (str "export/" path))))

(defmulti ^:private sheet-cell-values class)

(defmethod sheet-cell-values Sheet [^Sheet sheet]
  (into [] (for [row (spreadsheet/row-seq sheet)]
             (mapv spreadsheet/read-cell (spreadsheet/cell-seq row)))))

(defmethod sheet-cell-values clojure.lang.IPersistentVector [^clojure.lang.IPersistentVector rows]
  (sheet-cell-values (seq rows)))

(defmethod sheet-cell-values clojure.lang.ISeq [^clojure.lang.ISeq rows]
  (mapv (fn [^clojure.lang.ISeq row]
          (mapv spreadsheet/read-cell row))
        rows))

(defn- sheet-cells [sheet]
  (into [] (map (fn [row] (spreadsheet/into-seq row))
                (spreadsheet/row-seq sheet))))

(defn- cell-value-properties [^Cell cell]
  {:type            (.getCellType cell)
   :value           (spreadsheet/read-cell cell)
   :quote-prefixed? (-> cell .getCellStyle .getQuotePrefixed)})

(defn- cell-width [^Cell cell]
  (let [sheet   (.getSheet cell)
        col-idx (.getColumnIndex cell)]
    (.getColumnWidth sheet col-idx)))

(defn- make-bare-avustushaku []
  {:content {:self-financing-percentage 10
             :focus-areas {:items [{:fi "Piste 1", :sv "s"}]
                           :label {:fi "Painopistealueet" :sv "Fokusområden"}}
             :selection-criteria {:items [{:fi "", :sv ""}]
                                  :label {:fi "Valintaperusteet", :sv "Urvalsgrunder"}}}
   :haku-type "erityisavustus"
   :decision {:date "19.1.2018"}})

(defn- make-bare-form [fields]
  {:content fields
   :rules '()})

(defn- make-bare-hakemus [answers]
  {:version-date (java.sql.Timestamp. 0)
   :project-name "projname1"
   :register-number "1/1/2018"
   :organization-name "orgname1"
   :budget-total 4500
   :budget-oph-share 4050
   :status "submitted"
   :language "fi"
   :answers answers})

(defn- make-bare-avustushaku-combined [hakemus-form-fields hakemus-answers]
  {:avustushaku        (make-bare-avustushaku)
   :form               (make-bare-form hakemus-form-fields)
   :hakemukset         (list (make-bare-hakemus hakemus-answers))
   :form_loppuselvitys (make-bare-form '())
   :loppuselvitykset   (list (make-bare-hakemus '()))})

(defn- make-bare-form-field
  ([]
   (make-bare-form-field {}))

  ([field-spec]
   (merge {:id "test"
           :label {:fi "test-label-fi", :sv "test-label-sv"}
           :params {:size "small", :maxlength 80}
           :helpText {:fi "test-help-fi", :sv "test-help-sv"}
           :required true
           :fieldType "textField"
           :fieldClass "formField"}
          field-spec)))

(defn- make-bare-answer
  ([]
   (make-bare-answer {}))

  ([answer]
   (merge {:key "test" :value "" :fieldType "textField"}
          answer)))

(defn- get-all-answers-cell [wb answer-label]
  (let [sheet      (spreadsheet/select-sheet export/hakemus-all-answers-sheet-name wb)
        header-row (first (sheet-cell-values sheet))
        column-idx (.indexOf (vec header-row) answer-label)]
    (when (< column-idx 0)
      (throw (IllegalArgumentException. (format "No column with label \"%s\"" answer-label))))
    (-> sheet
        (.getRow 1)
        (.getCell column-idx))))

(defn- get-table-sheet-cells [wb]
  (let [sheet (spreadsheet/select-sheet export/hakemus-table-answers-sheet-name wb)]
    (sheet-cells sheet)))

(defn- save-load-workbook [avustushaku]
  (-> avustushaku
      export/export-avustushaku
      (ByteArrayInputStream.)
      spreadsheet/load-workbook))

(defn- save-load-all-answers-cell
  ([answer-value]
   (save-load-all-answers-cell answer-value {}))

  ([answer-value field-spec]
   (let [form-field (make-bare-form-field field-spec)
         answer     (make-bare-answer {:value answer-value})
         wb         (save-load-workbook (make-bare-avustushaku-combined (list form-field)
                                                                        (list answer)))]
     (get-all-answers-cell wb (get-in form-field [:label :fi])))))

(defn- save-load-table-fields [field-params answer-values]
  (let [field-ids   (map (fn [idx] (str "test-" idx)) (range))
        form-fields (map (fn [id p] (make-bare-form-field {:id id :fieldType "tableField" :params p}))
                         field-ids
                         field-params)
        answers     (map (fn [id v] (make-bare-answer {:key id :fieldType "tableField" :value v}))
                         field-ids
                         answer-values)
        wb          (save-load-workbook (make-bare-avustushaku-combined form-fields answers))]
    (get-table-sheet-cells wb)))

(describe "Excel export"
  (it "allows nil IBAN in form submission input"
    (let [paatos-data (export/add-paatos-data nil {:answers []})]
      (should-be-nil (:iban paatos-data))))

  (it "adds LKP-TILI to päätösdata output"
    (let [paatos-data (export/add-paatos-data nil {:answers [{:key       "radioButton-0"
                                                              :value     "yliopisto"
                                                              :fieldType "radioButton"}]})]
      (should= 82921000 (:lkp paatos-data))))

  (it "removes dots from talousarviotili to be used as TAKP"
    (let [paatos-data (export/add-paatos-data nil {:arvio {:talousarviotili "1.2.3.4"}})]
      (should= "1234" (:takp paatos-data))))

  (it "quotes cell with formula like value"
    (should= {:type            CellType/STRING
              :value           "=1+1"
              :quote-prefixed? true}
             (cell-value-properties (save-load-all-answers-cell "=1+1"))))

  (it "does not quote cell with regular value"
    (should= {:type            CellType/STRING
              :value           "1"
              :quote-prefixed? false}
             (cell-value-properties (save-load-all-answers-cell "1")))
    (should= {:type            CellType/NUMERIC
              :value           1.0
              :quote-prefixed? false}
             (cell-value-properties (save-load-all-answers-cell 1))))

  (it "fits column for value less than threshold in size"
    (let [rand-value                  (partial rand-string "abc")
          [fitted-value-no-newlines
           fitted-value-with-newlines
           not-fitted-value]          (for [cell-value [(rand-value (- export/cell-value-no-fit-threshold-in-chars 1))
                                                        (string/join "\n" (repeat 3 rand-value))
                                                        (rand-value export/cell-value-no-fit-threshold-in-chars)]]
                                        (cell-width (save-load-all-answers-cell cell-value {:label {:fi ""}})))]
      (should-be #(> % not-fitted-value) fitted-value-no-newlines)
      (should-be #(> % not-fitted-value) fitted-value-with-newlines)))

  (it "pads table with many rows after table with few rows"
    (let [cell-values (sheet-cell-values (save-load-table-fields [{:columns [{:title {:fi "1-a"}}]
                                                                   :rows    [{:title {:fi "1-1"}}
                                                                             {:title {:fi "1-2"}}]}
                                                                  {:columns [{:title {:fi "2-a"}}]}]
                                                                 [[["1-a1"] ["1-a2"]]
                                                                  [["2-a1"] ["2-a2"] ["2-a3"]]]))]
      (should= [[nil nil nil nil nil "test-label-fi" nil nil "test-label-fi" nil]
                ["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" nil nil "1-a" nil "2-a" nil]
                ["1/1/2018" "orgname1" "projname1" "fi" nil "1-1" "1-a1" nil "2-a1" nil]
                [nil nil nil nil nil "1-2" "1-a2" nil "2-a2" nil]
                [nil nil nil nil nil nil nil nil "2-a3" nil]
                [nil nil nil nil nil nil nil nil nil nil]]
               cell-values)))

  (it "pads table columns by number of specified columns, not number of columns in answers"
    (let [cell-values (sheet-cell-values (save-load-table-fields [{:columns [{:title {:fi "1-a"}}]}
                                                                  {:columns [{:title {:fi "2-a"}}
                                                                             {:title {:fi "2-b"}}]}]
                                                                 [[["1-a1" "1-b1"] ["1-a2"]]
                                                                  [["2-a1"] ["2-a2" "2-b2" "2-c2"] ["2-a3" "2-b3"]]]))]
      (should= [[nil nil nil nil nil "test-label-fi" nil "test-label-fi" nil nil]
                ["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" nil "1-a" nil "2-a" "2-b" nil]
                ["1/1/2018" "orgname1" "projname1" "fi" nil "1-a1" nil "2-a1" nil nil]
                [nil nil nil nil nil "1-a2" nil "2-a2" "2-b2" nil]
                [nil nil nil nil nil nil nil "2-a3" "2-b3" nil]
                [nil nil nil nil nil nil nil nil nil nil]]
               cell-values)))

  (it "pads table rows by number of rows in answers, filling missing row labels with nils"
    (let [cell-values (sheet-cell-values (save-load-table-fields [{:columns [{:title {:fi "1-a"}}]
                                                                   :rows    [{:title {:fi "1-1"}}]}
                                                                  {:columns [{:title {:fi "2-a"}}
                                                                             {:title {:fi "2-b"}}]
                                                                   :rows    [{:title {:fi "2-1"}}
                                                                             {:title {:fi "2-2"}}]}]
                                                                 [[["1-a1"] ["1-a2"]]
                                                                  [["2-a1" "2-b1"]]]))]
      (should= [[nil nil nil nil nil "test-label-fi" nil nil "test-label-fi" nil nil nil]
                ["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" nil nil "1-a" nil nil "2-a" "2-b" nil]
                ["1/1/2018" "orgname1" "projname1" "fi" nil "1-1" "1-a1" nil "2-1" "2-a1" "2-b1" nil]
                [nil nil nil nil nil nil "1-a2" nil "2-2" nil nil nil]
                [nil nil nil nil nil nil nil nil nil nil nil nil]]
               cell-values)))

  (it "exports avustushaku with simple form"
    (let [wb (save-load-workbook (read-edn-resource "avustushaku-combined-simple-form.edn"))]
      (should= [["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" "Ehdotettu budjetti" "OPH:n avustuksen osuus" "Myönnetty avustus" "Arviokeskiarvo"]
                ["1/351/2018" "Hakija 1 fi" "" "fi" 4500.0 4050.0 4005.0 nil]
                ["2/351/2018" "Hakija 2 sv" "" "sv" 35433.0 31889.0 31860.0 nil]
                ["3/351/2018" "Hakija 3 fi" "" "fi" 3059.0 2753.0 0.0 nil]]
               (sheet-cell-values (spreadsheet/select-sheet export/main-sheet-name wb)))
      (should= [["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" "Ehdotettu budjetti" "OPH:n avustuksen osuus" "Myönnetty avustus" "Arviokeskiarvo" "Hakijaorganisaatio" "Organisaation sähköposti" "Y-tunnus" "Yhteyshenkilö" "Sähköposti" "Osoite" "Allekirjoitusoikeudellinen henkilö" "Sähköposti" "Tilinumero IBAN-muodossa" "Pankin BIC/SWIFT-koodi" "Oppilaitosmuoto" "Hankkeen kustannukset" "Hankkeen kustannukset" "EU-ohjelmat" "EU-ohjelmat" "Muu julkinen rahoitus" "Muu julkinen rahoitus" "Yksityinen rahoitus" "Yksityinen rahoitus" "Muut tulot" "Muut tulot"]
                ["1/351/2018" "Hakija 1 fi" "" "fi" 4500.0 4050.0 4005.0 nil "Hakija 1" "username+org1@example.com" "4580113-5" "Matti Virtanen" "username+con1@example.com" "Kujakatu 1" "Matti Virtanen" "username+sig1@example.com" "FI44 8571 1440 0073 18" "OKOASDFG" "Kansanopisto" "Tarkenna tarvittaessa" 4500.0 "" 0.0 "" 0.0 "" 0.0 "" 0.0]
                ["2/351/2018" "Hakija 2 sv" "" "sv" 35433.0 31889.0 31860.0 nil "Hakija 2" "username+org2@example.com" "5275506-9" "Pär Matsby" "username+sig2@example.com" "Kujakatu 2" "Pär Matsby" "username+con2@example.com" "FI24 3469 0460 0017 69" "OKASDFGH" "Kesäyliopisto" "TODO: Tarkenna tarvittaessa" 35433.0 "" 0.0 "" 0.0 "" 0.0 "" 0.0]
                ["3/351/2018" "Hakija 3 fi" "" "fi" 3059.0 2753.0 0.0 nil "Hakija 3" "username+org3@example.com" "5838851-1" "Maija Pulkkinen" "username+con3@example.com" "Kujakatu 3" "Maija Pulkkinen" "username+sig3@example.com" "FI77 4954 7376 0007 93" "OKOASDFG" "Kansanopisto" "Tarkenna tarvittaessa" 3459.0 "asd" 400.0 "" 0.0 "" 0.0 "" 0.0]]
               (sheet-cell-values (spreadsheet/select-sheet export/hakemus-all-answers-sheet-name wb)))
      (should-be-nil (spreadsheet/select-sheet export/hakemus-table-answers-sheet-name wb))
      (should= [["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" "Toteutunut budjetti" "OPH:n avustuksen osuus"]]
               (sheet-cell-values (spreadsheet/select-sheet export/loppuselvitys-all-answers-sheet-name wb)))
      (should= [["Maksuerä" "Toimittaja-numero" "Toimittajan nimi" "Pankkitili" "Maksuliike-menotili" "Eräpvm" "EUR" "Val" "Maksu ehto" "Pitkä viite" "Laskun päivämäärä" "Tositelaji" "Tosite-päivä" "LKP-TILI" "ALV-koodi" "Tiliöinti-summa" "Toiminta-yksikkö" "TaKp-tili" "Valtuus-numero" "Projekti" "Suorite" "Alue / Kunta" "Kumppani" "Seuranta kohde 1" "Seuranta kohde 2" "Varalla 1" "Varalla 1" "KOM-yksikkö" "Selite (Tiliöinti)" "Asiatarkastajan sähköpostiosoite" "Hyväksyjän sähköpostiosoite"]
                [1.0 "" "Hakija 1 fi" "FI4485711440007318" "FI1950000121501406" "" 4005.0 "EUR" "Z001" "1/351/2018" "19012018" "XE" "19012018" nil "" 4005.0 "" "" "" "" "" "" "" "" "" "" "" "" "" "" ""]
                [1.0 "" "Hakija 2 sv" "FI2434690460001769" "FI1950000121501406" "" 31860.0 "EUR" "Z001" "2/351/2018" "19012018" "XE" "19012018" nil "" 31860.0 "" "" "" "" "" "" "" "" "" "" "" "" "" "" ""]]
               (sheet-cell-values (spreadsheet/select-sheet export/maksu-sheet-name wb)))
      (should-be-nil (spreadsheet/select-sheet export/loppuselvitys-table-answers-sheet-name wb))))

  (it "exports avustushaku with complex form"
    (let [wb (save-load-workbook (read-edn-resource "avustushaku-combined-complex-form.edn"))]
      (should= [["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" "Ehdotettu budjetti" "OPH:n avustuksen osuus" "Myönnetty avustus" "Arviokeskiarvo"]
                ["1/344/2018" "Hakijaorg 1" "Hanke 1" "fi" 36700.0 28259.0 27412.0 1.0]
                ["2/344/2018" "Hakijaorg 2" "Hanke 2" "fi" 34700.0 26719.0 25872.0 1.5]
                ["3/344/2018" "Hakijaorg 3" "Hanke 3" "sv" 82710.0 63686.0 63217.0 2.5]
                ["5/344/2018" "Hakijaorg 4" "Hanke 4" "fi" 426740.0 328589.0 0.0 0.0]]
               (sheet-cell-values (spreadsheet/select-sheet export/main-sheet-name wb)))
      (should= [["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" "Ehdotettu budjetti" "OPH:n avustuksen osuus" "Myönnetty avustus" "Arviokeskiarvo" "Hakijaorganisaatio" "Organisaation sähköposti" "Y-tunnus" "Yhteyshenkilö" "Sähköposti" "Tilinumero IBAN-muodossa" "Pankin BIC/SWIFT-koodi" "Allekirjoitusoikeuden omaava henkilö 1" "Sähköposti 1" "Allekirjoitusoikeuden omaava henkilö 2" "Sähköposti 2" "Allekirjoitusoikeuden omaava henkilö 3" "Sähköposti 3" "Omistajatyyppi" "Mitä kulkuneuvoja käytät työmatkoihin?" "Ruokavalio" "Hankkeen nimi" "Asiointikieli" "Painopistealueet" "Suoritettu tutkinto tai osatutkinto 1" "Tutkinnon suorittaja 1" "Tutkintosuoritus (pp.kk.vuosi) 1" "Haettava avustus 1" "Suoritettu tutkinto tai osatutkinto 2" "Tutkinnon suorittaja 2" "Tutkintosuoritus (pp.kk.vuosi) 2" "Haettava avustus 2" "Suoritettu tutkinto tai osatutkinto 3" "Tutkinnon suorittaja 3" "Tutkintosuoritus (pp.kk.vuosi) 3" "Haettava avustus 3" "Tutkintoja yhteensä (kpl)" "Osallistuneita yhteensä (kpl) " "Koulutusosion nimi 1" "Keskeiset sisällöt ja toteuttamistapa 1" "Kohderyhmät 1" "Koulutettavapäivät 1" "Koulutusosion nimi 2" "Keskeiset sisällöt ja toteuttamistapa 2" "Kohderyhmät 2" "Koulutettavapäivät 2" "Koulutusosion nimi 3" "Keskeiset sisällöt ja toteuttamistapa 3" "Kohderyhmät 3" "Koulutettavapäivät 3" "Taidekurssit, pakolliset" "Valinnaiset kurssit" "Väriarvostelu" "Suosikkivärisi. Väri on auringosta tai muusta valolähteestä tulevaa aaltomuotoista sähkömagneettista säteilyä eli valoa. Jokaista värisävyä vastaa oma aallonpituus. Pisin aallonpituus on punaisella ja lyhin violetilla. Ihmiselle näkyvien värien ääripäiden lisäksi puhutaan infrapunasta, jonka aallon pituus on pitempi kuin näkyvä valo ja se voidaan tuntea lämpönä. Puhutaan myös ultravioletista, joka on lyhytaaltoisempaa kuin näkyvä valo. Ihminen aistii värin, kun valo heijastuu jostakin värillisestä kohteesta silmän verkkokalvolle. Toisin kuin monet muut nisäkkäät, ihminen näkee maailman väreissä." "Hankkeen kustannukset" "Hankkeen kustannukset" "Laitteistokustannukset" "Laitteistokustannukset" "EU-ohjelmat" "EU-ohjelmat" "Muu julkinen rahoitus" "Muu julkinen rahoitus" "Yksityinen rahoitus" "Yksityinen rahoitus" "Muut tulot" "Muut tulot"]
                ["1/344/2018" "Hakijaorg 1" "Hanke 1" "fi" 36700.0 28259.0 27412.0 1.0 "Hakijaorg 1" "hakijaorg1+org@example.com" "6745538-4" "Anna Con Aamu" "hakijaorg1+con@example.com" "FI50 4285 0060 0007 32" "OKASDFG1" "Anssi Sig1 Aamu" "hakijaorg1+sig1@example.com" "Antero Sig2 Aamu" "hakijaorg1+sig2@example.com" nil nil "Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko" "Bussi; Polkypyörä" "Kaikki" "Hanke 1" "Suomi" "paino 1" "tut11" "suor11" "01.01.1991" 1100.0 "tut12" "suor12" "01.02.1991" 1200.0 "tut13" "suor13" "01.03.1991" 1300.0 "11" "110" "koul1" "sis1" "kohder1" 594.0 nil nil nil nil nil nil nil nil "taid11 | 11 | 110\ntaid12 | 12 | 120\ntaid13 | 13 | 130" "phy11 | 14 | 140\nphy12 | 15 | 150" "hyvä1\nparempi1\nparas1" "keltainen1\nruskea1\nvioletti1" "budhankkust1" 41000.0 "budlaittkust1" 1100.0 "budeurah1" 1200.0 "budmuujulkrah1" 1300.0 "budyksrah1" 1400.0 "budmuuttulot1" 1500.0]
                ["2/344/2018" "Hakijaorg 2" "Hanke 2" "fi" 34700.0 26719.0 25872.0 1.5 "Hakijaorg 2" "hakijaorg2+org@example.com" "0887710-6" "Barbie Con Björnvall" "hakijaorg2+con@example.com" "FI20 3158 5930 0044 14" "OKDSFGD2" "Bert Sig1 Björnvall" "hakijaorg2+sig1@example.com" "Björn Sig2 Björnval" "hakijaorg2+sig2@example.com" "Bo Sig3-1 Björnvall" "hakijaorg2+sig3@example.com" "Liiketaloudellisin perustein toimiva yhtiö" "Polkypyörä; Auto" "Kasvissyöjä" "Hanke 2" "Suomi" "paino 2; paino 3" "tut21-2" "suor21-2" "02.01.1992" 2100.0 "tut22-1" "suor22" "03.01.1992" 2200.0 nil nil nil nil "21" "210" "koul2-1" "koulsis2-1" "koulryhm2-1" 2079.0 "koul2-2" "koulsis2-2" "koulryhm2-2" 506.0 nil nil nil nil "taid21 | 21 | 210\ntaid22 | 22 | 220\ntaid23 | 23 | 230" "phy21 |  | 240\nphy22 | 25 | 250" "hyvä2\nparempi2\nparas2" "keltainen2\nruskea2" "budhankkust2" 42000.0 "budlaittkust2" 2100.0 "budeurah2" 2200.0 "budmuujulkrah2" 2300.0 "budyksrah2" 2400.0 "budmuuttulot2" 2500.0]
                ["3/344/2018" "Hakijaorg 3" "Hanke 3" "sv" 82710.0 63686.0 63217.0 2.5 "Hakijaorg 3" "hakijaorg3+org@example.com" "7115553-6" "Carl Con Cornwell" "hakijaorg3+con@example.com" "FI48 4235 8717 0000 48" "GADFGGH3" "Cecil Sig1 Cornwel" "hakijaorg3+sig1@example.com" nil nil nil nil "Voittoa tavoittelematon yhteisö" "Auto" "Kaikki" "Hanke 3" "Ruotsi" "paino 3" "tut31" "suor31" "03.01.1993" 3100.0 "tut32-1" "suor32-1" "4.1.1993" 3200.0 nil nil nil nil "31" "310" "koul3-1" "koulsis3-1" "koulryhm3-1" 992.0 "koul3-2" "koulsis3-2" "koulryhm3-2" 4752.0 "koul3-3" "koulsis3-3" "koulryhm3-3" 1122.0 "taid31 | 31 | 31,1\ntaid32 | 32 | 32,2\ntaid33 | 33 | 33,3" "" "hyvä3\nparempi3\nparas3" "" "budhankkust3" 93010.0 "budlaittkust3" 3100.0 "budeurah3" 3200.0 "budmuujulkrah3" 3300.0 "budyksrah3" 3400.0 "budmuuttulot3" 3500.0]
                ["5/344/2018" "Hakijaorg 4" "Hanke 4" "fi" 426740.0 328589.0 0.0 0.0 "Hakijaorg 4" "hakijaorg4+org@example.com" "5072510-6" "Dan D. Davis" "hakijaorg4+con@example.com" "FI84 4704 7766 0000 59" "OOOKFFG4" "David Sig1 Dumbledore" "hakijaorg4+sig1@example.com" nil nil nil nil "EU-jäsenvaltiot" "Polkypyörä; Juna" "Hyönteiset" "Hanke 4" "Suomi" "paino 3" "tut41" "suor41" "04.01.1994" 4100.0 "tut42" "suor42" "04.02.1994" 4200.0 nil nil nil nil "41" "410" "koul4-1" "koulsis4-1" "koulryhm4-1" 594.0 nil nil nil nil nil nil nil nil "taid41 | 41 | 41,1\ntaid42 | 42 | 42,2\ntaid43 | 43 | 43,3" "valin44 | 44 | 44,4" "hyvä4\nparempi4\nparas4" "" "budhankkust4" 440040.0 "budlaitkust4" 4100.0 "budeurah4" 4200.0 "budmuujulkrah4" 4300.0 "budyksrah4" 4400.0 "budmuuttulot4" 4500.0]]
               (sheet-cell-values (spreadsheet/select-sheet export/hakemus-all-answers-sheet-name wb)))
      (should= [[nil nil nil nil nil "Taidekurssit, pakolliset" nil nil nil nil "Valinnaiset kurssit" nil nil nil "Väriarvostelu" nil nil "Suosikkivärisi. Väri on auringosta tai muusta valolähteestä tulevaa aaltomuotoista sähkömagneettista säteilyä eli valoa. Jokaista värisävyä vastaa oma aallonpituus. Pisin aallonpituus on punaisella ja lyhin violetilla. Ihmiselle näkyvien värien ääripäiden lisäksi puhutaan infrapunasta, jonka aallon pituus on pitempi kuin näkyvä valo ja se voidaan tuntea lämpönä. Puhutaan myös ultravioletista, joka on lyhytaaltoisempaa kuin näkyvä valo. Ihminen aistii värin, kun valo heijastuu jostakin värillisestä kohteesta silmän verkkokalvolle. Toisin kuin monet muut nisäkkäät, ihminen näkee maailman väreissä." nil]
                ["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" nil nil "Oppilaitos" "Opiskelijoita" "Tuntimäärä" nil "Kurssi" "Opiskelijoita" "Tuntimäärä" nil nil "Arvostelu" nil "Väri" nil]
                ["1/344/2018" "Hakijaorg 1" "Hanke 1" "fi" nil "Perspektiivi 101" "taid11" "11" "110" nil "phy11" "14" "140" nil "Sininen" "hyvä1" nil "keltainen1" nil]
                [nil nil nil nil nil "Vesivärit" "taid12" "12" "120" nil "phy12" "15" "150" nil "Punainen" "parempi1" nil "ruskea1" nil]
                [nil nil nil nil nil "Liidut" "taid13" "13" "130" nil nil nil nil nil "Vihreä" "paras1" nil "violetti1" nil]
                [nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil]
                ["2/344/2018" "Hakijaorg 2" "Hanke 2" "fi" nil "Perspektiivi 101" "taid21" "21" "210" nil "phy21" "" "240" nil "Sininen" "hyvä2" nil "keltainen2" nil]
                [nil nil nil nil nil "Vesivärit" "taid22" "22" "220" nil "phy22" "25" "250" nil "Punainen" "parempi2" nil "ruskea2" nil]
                [nil nil nil nil nil "Liidut" "taid23" "23" "230" nil nil nil nil nil "Vihreä" "paras2" nil nil nil]
                [nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil]
                ["3/344/2018" "Hakijaorg 3" "Hanke 3" "sv" nil "Perspektiivi 101" "taid31" "31" "31,1" nil nil nil nil nil "Sininen" "hyvä3" nil nil nil]
                [nil nil nil nil nil "Vesivärit" "taid32" "32" "32,2" nil nil nil nil nil "Punainen" "parempi3" nil nil nil]
                [nil nil nil nil nil "Liidut" "taid33" "33" "33,3" nil nil nil nil nil "Vihreä" "paras3" nil nil nil]
                [nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil]
                ["5/344/2018" "Hakijaorg 4" "Hanke 4" "fi" nil "Perspektiivi 101" "taid41" "41" "41,1" nil "valin44" "44" "44,4" nil "Sininen" "hyvä4" nil nil nil]
                [nil nil nil nil nil "Vesivärit" "taid42" "42" "42,2" nil nil nil nil nil "Punainen" "parempi4" nil nil nil]
                [nil nil nil nil nil "Liidut" "taid43" "43" "43,3" nil nil nil nil nil "Vihreä" "paras4" nil nil nil]
                [nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil nil]]
               (sheet-cell-values (spreadsheet/select-sheet export/hakemus-table-answers-sheet-name wb)))
      (should= [["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" "Toteutunut budjetti" "OPH:n avustuksen osuus" "Hankkeen nimi ja yhteishenkilö ja hänen yhteystiedot" "Lyhyt yhteenveto hankkeesta " "Miten hanke on käytännössä toteutettu? " "Hankkeen/toiminnan tavoite 1" "Toiminta, jolla tavoitteeseen on pyritty 1" "Konkreettiset tulokset, jotka tavoitteen osalta saavutettiin 1" "Hankkeen/toiminnan tavoite 2" "Toiminta, jolla tavoitteeseen on pyritty 2" "Konkreettiset tulokset, jotka tavoitteen osalta saavutettiin 2" "Miten hankeen toimintaa, tuloksia ja vaikutuksia on arvioitu?" "Arvostelut" "Miten hankkeesta/toiminnasta on tiedotettu?" "Tuotokset 1" "Kuvaus 1" "Saatavuustiedot, www-osoite tms. 1" "Lisätietoja 1" "Tuotokset 2" "Kuvaus 2" "Saatavuustiedot, www-osoite tms. 2" "Lisätietoja 2" "Hankkeesta/toiminnasta on esitetty ehdotuksia OPH:n hyvien käytäntöjen portaaliin" "Mikäli kyllä, ehdotuksen tai hyväksytyn käytännön tunnus" "Miten hankkeessa syntyviä tuloksia on tunnistettu, levitetty ja hyödynnetty?" "Hankkeen toimintaverkosto (muut koulutuksen järjestäjät ja koulut, yhteystiedot ja yhteyshenkilöt)" "Hankkeen toteuttamiseen osallistuneet muut yhteistyökumppanit " "Johtopäätökset, jatkotoimenpiteet ja kehittämisehdotukset" "Lisätietoja" "Kirjanpidon pääkirjaote" "Muu liite 1" "Hankkeen kustannukset" "Hankkeen kustannukset" "Laitteistokustannukset" "Laitteistokustannukset" "EU-ohjelmat" "EU-ohjelmat" "Muu julkinen rahoitus" "Muu julkinen rahoitus" "Yksityinen rahoitus" "Yksityinen rahoitus" "Muut tulot" "Muut tulot" "Verkostohankkeiden rahoitusselvitys"]
                ["1/344/2018" "" "" "fi" 35880.0 27627.0 "Hakijaorg 1 hanke" "=1+2" "-1-3" "ttt-tavoite 1-1" "ttt-toiminta 1-1" "ttt-tulokset 1-1" "ttt-tavoite 1-2" "ttt-toiminta 1-2" "=1+1" "arvioitu 1" "arv-1 | 19\narv-2 | 18" "tiedotettu 1" "Raportti" "tuot-kuvaus 1-1" "tuot-saatavuus 1-1" "tuot-lisätietoja 1-1" "Toimintamalli" "tuot-kuvaus 1-2" "tuot-saatavuus 1-2" "" "Kyllä" "käytännön tunnus 1" "synt-tulokset 1" "toimintaverkosto 1" "muut yhteistyökumppanit 1" "johtopäätökset 1" "lisätietoja 1" "foo-1.txt" "ids.txt" "budhankkust1" 40200.0 "budlaitteistokust1" 1100.0 "budeurah1" 1205.0 "budmuujulkrah1" 1305.0 "budmyksrah1" 1405.0 "budmuuttulos1" 1505.0 "lol.js.txt"]
                ["3/344/2018" "" "" "sv" 81600.0 62832.0 "Hakijaorg 3 hanke" "Yhtveto 3" "Hanketot 3" "ttt-tavoite 3-1" "ttt-toiminta 3-1" "ttt-tulokset 3-1" nil nil nil "arvioitu 3" "" "tiedotettu 3" "Muu tuotos" "tuot-kuvaus 3-1" "tuot-saatavuus 3-1" "tuot-lisätietoja 3-1" nil nil nil nil "Ei" nil "synt-tulokset 3" "toimintaverkosto 3" "muut yhteistyökumppanit 3" "johtopäätökset 3" "lisätietoja 3" "foo-2.txt" nil "budhankkust3" 92500.0 "budlaitteistokust3" 2500.0 "budeurah1" 3200.0 "budmuujulkrah3" 3300.0 "budmyksrah3" 3400.0 "budmuuttulos3" 3500.0 "ids2.txt"]]
               (sheet-cell-values (spreadsheet/select-sheet export/loppuselvitys-all-answers-sheet-name wb)))
      (should= [["Maksuerä" "Toimittaja-numero" "Toimittajan nimi" "Pankkitili" "Maksuliike-menotili" "Eräpvm" "EUR" "Val" "Maksu ehto" "Pitkä viite" "Laskun päivämäärä" "Tositelaji" "Tosite-päivä" "LKP-TILI" "ALV-koodi" "Tiliöinti-summa" "Toiminta-yksikkö" "TaKp-tili" "Valtuus-numero" "Projekti" "Suorite" "Alue / Kunta" "Kumppani" "Seuranta kohde 1" "Seuranta kohde 2" "Varalla 1" "Varalla 1" "KOM-yksikkö" "Selite (Tiliöinti)" "Asiatarkastajan sähköpostiosoite" "Hyväksyjän sähköpostiosoite"]
                [1.0 "" "Hakijaorg 1" "FI5042850060000732" "FI1950000121501406" "" 27412.0 "EUR" "Z001" "1/344/2018" "20032018" "XE" "20032018" 8.201E7 "" 27412.0 "" "" "" "" "" "" "" "" "" "" "" "" "" "" ""]
                [1.0 "" "Hakijaorg 2" "FI2031585930004414" "FI1950000121501406" "" 25872.0 "EUR" "Z001" "2/344/2018" "20032018" "XE" "20032018" 8.231E7 "" 25872.0 "" "" "" "" "" "" "" "" "" "" "" "" "" "" ""]
                [1.0 "" "Hakijaorg 3" "FI4842358717000048" "FI1950000121501406" "" 37930.0 "EUR" "Z001" "3/344/2018" "20032018" "XE" "20032018" 8.251E7 "" 37930.0 "" "" "" "" "" "" "" "" "" "" "" "" "" "" ""]
                [2.0 "" "Hakijaorg 3" "FI4842358717000048" "FI1950000121501406" "" 25287.0 "EUR" "Z001" "3/344/2018" "20032018" "XE" "20032018" 8.251E7 "" 25287.0 "" "" "" "" "" "" "" "" "" "" "" "" "" "" ""]]
               (sheet-cell-values (spreadsheet/select-sheet export/maksu-sheet-name wb)))
      (should= [[nil nil nil nil nil "Arvostelut" nil nil]
                ["Asianumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" nil "Kuvaus" "Pisteet" nil]
                ["1/344/2018" "" "" "fi" nil "arv-1" "19" nil]
                [nil nil nil nil nil "arv-2" "18" nil]
                [nil nil nil nil nil nil nil nil]
                ["3/344/2018" "" "" "sv" nil nil nil nil]
                [nil nil nil nil nil nil nil nil]]
               (sheet-cell-values (spreadsheet/select-sheet export/loppuselvitys-table-answers-sheet-name wb))))))

(run-specs)
