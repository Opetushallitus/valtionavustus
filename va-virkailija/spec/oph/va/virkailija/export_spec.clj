(ns oph.va.virkailija.export-spec
  (:require [speclj.core :refer :all]
            [clojure.edn :as edn]
            [clojure.java.io :as io]
            [dk.ative.docjure.spreadsheet :as spreadsheet]
            [oph.va.virkailija.export :as export])
  (:import [java.io ByteArrayInputStream]))

(defn- get-avustushaku-combined []
  (with-open [r (io/reader (io/resource "export/avustushaku_combined.edn"))]
    (edn/read (java.io.PushbackReader. r))))

(defn- sheet-cell-values [sheet]
  (for [row (spreadsheet/into-seq sheet)]
    (for [cell row]
      (spreadsheet/read-cell cell))))

(describe "Excel export"
  (it "allows nil IBAN in form submission input"
    (let [paatos-data (export/add-paatos-data nil {:answers []})]
      (should-be-nil (:iban paatos-data))))

  (it "adds LKP-TILI to päätösdata output"
    (let [paatos-data (export/add-paatos-data nil {:answers [{:key       "radioButton-0"
                                                              :value     "yliopisto"
                                                              :fieldType "radioButton"}]})]
      (should= 82930000 (:lkp paatos-data))))

  (it "removes dots from talousarviotili to be used as takp"
    (let [paatos-data (export/add-paatos-data nil {:arvio {:talousarviotili "1.2.3.4"}})]
      (should= "1234" (:takp paatos-data))))

  (it "exports avustushaku"
    (let [export (export/export-avustushaku (get-avustushaku-combined))
          wb     (spreadsheet/load-workbook (ByteArrayInputStream. export))]
      (should= [["Diaarinumero" "Hakijaorganisaatio" "Hankkeen nimi" "Asiointikieli" "Ehdotettu budjetti" "OPH:n avustuksen osuus" "Myönnetty avustus" "Arviokeskiarvo"]
                ["1/351/2018" "Hakija 1 fi" "" "fi" 4500.0 4050.0 4005.0 nil]
                ["3/351/2018" "Hakija 3 fi" "" "fi" 3059.0 2753.0 0.0 nil]
                ["2/351/2018" "Hakija 2 sv" "" "sv" 35433.0 31889.0 31860.0 nil]]
               (sheet-cell-values (spreadsheet/select-sheet "Hakemukset" wb)))
      (should= [["Diaarinumero" "Hakijaorganisaatio" "Projektin nimi" "Asiointikieli" "Ehdotettu budjetti" "OPH:n avustuksen osuus" "Myönnetty avustus" "Arviokeskiarvo" "Hakijaorganisaatio" "Organisaation sähköposti" "Y-tunnus" "Yhteyshenkilö" "Sähköposti" "Osoite" "Allekirjoitusoikeudellinen henkilö" "Sähköposti" "Tilinumero IBAN-muodossa" "Pankin BIC/SWIFT-koodi" "Oppilaitosmuoto" "Hankkeen kustannukset" "Hankkeen kustannukset" "EU-ohjelmat" "EU-ohjelmat" "Muu julkinen rahoitus" "Muu julkinen rahoitus" "Yksityinen rahoitus" "Yksityinen rahoitus" "Muut tulot" "Muut tulot"]
                ["1/351/2018" "Hakija 1 fi" "" "fi" 4500.0 4050.0 4005.0 nil "Hakija 1" "username+org1@example.com" "4580113-5" "Matti Virtanen" "username+con1@example.com" "Kujakatu 1" "Matti Virtanen" "username+sig1@example.com" "FI44 8571 1440 0073 18" "OKOASDFG" "Kansanopisto" "Tarkenna tarvittaessa" 4500.0 "" 0.0 "" 0.0 "" 0.0 "" 0.0]
                ["2/351/2018" "Hakija 2 sv" "" "sv" 35433.0 31889.0 31860.0 nil "Hakija 2" "username+org2@example.com" "5275506-9" "Pär Matsby" "username+sig2@example.com" "Kujakatu 2" "Pär Matsby" "username+con2@example.com" "FI24 3469 0460 0017 69" "OKASDFGH" "Kesäyliopisto" "TODO: Tarkenna tarvittaessa" 35433.0 "" 0.0 "" 0.0 "" 0.0 "" 0.0]
                ["3/351/2018" "Hakija 3 fi" "" "fi" 3059.0 2753.0 0.0 nil "Hakija 3" "username+org3@example.com" "5838851-1" "Maija Pulkkinen" "username+con3@example.com" "Kujakatu 3" "Maija Pulkkinen" "username+sig3@example.com" "FI77 4954 7376 0007 93" "OKOASDFG" "Kansanopisto" "Tarkenna tarvittaessa" 3459.0 "asd" 400.0 "" 0.0 "" 0.0 "" 0.0]]
               (sheet-cell-values (spreadsheet/select-sheet "Vastaukset" wb)))
      (should= [["Maksuerä" "Toimittaja-numero" "Toimittajan nimi" "Pankkitili" "Maksuliike-menotili" "Eräpvm" "EUR" "Val" "Maksu ehto" "Pitkä viite" "Laskun päivämäärä" "Tositelaji" "Tosite-päivä" "LKP-TILI" "ALV-koodi" "Tiliöinti-summa" "Toiminta-yksikkö" "TaKp-tili" "Valtuus-numero" "Projekti" "Toiminto" "Suorite" "Alue / Kunta" "Kumppani" "Seuranta kohde 1" "Seuranta kohde 2" "Varalla 1" "Varalla 1" "KOM-yksikkö" "Selite (Tiliöinti)" "Asiatarkastajan sähiköpostiosoite" "Hyväksyjän sähiköpostiosoite"]
                [1.0 "" "Hakija 1 fi" "FI4485711440007318" "FI1950000121501406" "" 4005.0 "EUR" "Z001" "1/351/2018" "19012018" "XA" "19012018" nil "" 4005.0 "" "" "" "" "6600151502" "" "" "" "" "" "" "" "" "" "" ""]
                [1.0 "" "Hakija 2 sv" "FI2434690460001769" "FI1950000121501406" "" 31860.0 "EUR" "Z001" "2/351/2018" "19012018" "XA" "19012018" nil "" 31860.0 "" "" "" "" "6600151502" "" "" "" "" "" "" "" "" "" "" ""]]
               (sheet-cell-values (spreadsheet/select-sheet "Tiliöinti" wb))))))

(run-specs)
