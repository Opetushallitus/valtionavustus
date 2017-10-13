(ns oph.common.organisation-service-spec
  (:require [speclj.core :refer :all]
            [oph.common.organisation-service :as o]))

(def contact-collection
  [{:kieli "kieli_fi#1" :email "info@turku.fi"}
   {:kieli "kieli_sv#1" :email "info@abo.fi"}
   {:kieli "kieli_fi#1" :osoite "PL 355" :postinumeroUri "posti_20101"}
   {:kieli "kieli_sv#1" :osoite "PL 356" :postinumeroUri "posti_20102"}
   {:kieli "kieli_fi#1" :www "http://www.turku.fi"}
   {:kieli "kieli_sv#1" :www "http://www.abo.fi"}
   {:kieli "kieli_fi#1" :numero "02  262 7229" :tyyppi "puhelin"}
   {:kieli "kieli_fi#1" :numero "02-330 001" :tyyppi "faksi"}
   {:kieli "kieli_sv#1" :numero "02-330 002", :tyyppi "puhelin"}
   {:kieli "kieli_fi#1" :postitoimipaikka "TURKU" :osoite "PL 355"}
   {:kieli "kieli_sv#1" :postitoimipaikka "ÅBO"}])

(def organisation
  {:nimi {:fi "Turun kaupunki" :sv "Åbo stad"}
   :ytunnus "0204819-8"
   :tyypit ["Koulutustoimija"]
   :yhteystiedot contact-collection})

(describe "Compacting organisation info"
  (it "compacts fields in search result"
    (let [compacted (o/compact-organisation-info :fi organisation)]
      (should= 5 (count compacted))
      (should= "info@turku.fi" (:email compacted))
      (should= "0204819-8" (:organisation-id compacted))
      (should= "Turun kaupunki" (:name compacted))
      (should-not (empty? (:contact compacted)))
      (should= 3 (count (:contact compacted)))
      (should= "TURKU" (get-in compacted [:contact :city]))
      (should= "PL 355" (get-in compacted [:contact :address]))
      (should= "20101" (get-in compacted [:contact :postal-number]))))

  (it "strips posti_ prefix from postinumeroUri field"
    (let [compacted (o/compact-organisation-info :fi (assoc organisation
                                                            :yhteystiedot
                                                            [{:kieli "kieli_fi#1"
                                                              :postinumeroUri "posti_40720"}]))]
      (should= "40720" (-> compacted :contact :postal-number))))

  (it "returns empty string for postal number when postinumeroUri field is null"
    (let [compacted (o/compact-organisation-info :fi (assoc organisation
                                                            :yhteystiedot
                                                            [{:kieli "kieli_fi#1"
                                                              :postinumeroUri nil}]))]
      (should= "" (-> compacted :contact :postal-number))))

  (it "returns empty string for postal number when postinumeroUri field does not exist"
    (let [compacted (o/compact-organisation-info :fi (assoc organisation
                                                            :yhteystiedot
                                                            []))]
      (should= "" (-> compacted :contact :postal-number))))

  (it "collects address parts across fieldsets if there's no osoiteTyyppi in any fieldset"
      (let [compacted (o/compact-organisation-info :fi (assoc organisation
                                                              :yhteystiedot
                                                              [{:kieli "kieli_fi#1"
                                                                :postitoimipaikka "JYVÄSKYLÄ"}
                                                               {:kieli "kieli_fi#1"
                                                                :osoite "Viitaniementie 1 A"}]))
            compacted-contact (:contact compacted)]
        (should= "Viitaniementie 1 A" (:address compacted-contact))
        (should= "JYVÄSKYLÄ" (:city compacted-contact))))

  (it "collects address parts from single fieldset if osoiteTyyppi exists in a fieldset"
      (let [compacted (o/compact-organisation-info :fi (assoc organisation
                                                              :yhteystiedot
                                                              [{:kieli "kieli_fi#1"
                                                                :osoite "Viitaniementie 1 A"
                                                                :postitoimipaikka "JYVÄSKYLÄ 1"}
                                                               {:kieli "kieli_fi#1"
                                                                :osoiteTyyppi "kaynti"
                                                                :osoite "Viitaniementie 1 B"
                                                                :postitoimipaikka "JYVÄSKYLÄ 2"}
                                                               {:kieli "kieli_fi#1"
                                                                :osoite "Viitaniementie 1 C"}]))
            compacted-contact (:contact compacted)]
        (should= "Viitaniementie 1 B" (:address compacted-contact))
        (should= "JYVÄSKYLÄ 2" (:city compacted-contact))))

  (it "prefers posti osoiteTyyppi over other values"
      (let [compacted (o/compact-organisation-info :fi (assoc organisation
                                                              :yhteystiedot
                                                              [{:kieli "kieli_fi#1"
                                                                :osoiteTyyppi "kaynti"
                                                                :postinumeroUri nil
                                                                :postitoimipaikka "JYVÄSKYLÄ 1"
                                                                :osoite "Viitaniementie 1 A"}
                                                               {:kieli "kieli_fi#1"
                                                                :osoiteTyyppi "posti"
                                                                :postinumeroUri "posti_40720"
                                                                :postitoimipaikka "JYVÄSKYLÄ 2"
                                                                :osoite "Viitaniementie 1 B"}
                                                               {:kieli "kieli_fi#1"
                                                                :osoiteTyyppi "kaynti"
                                                                :postinumeroUri nil
                                                                :postitoimipaikka ""
                                                                :osoite "Viitaniementie 1 C"}]))
            compacted-contact (:contact compacted)]
        (should= "Viitaniementie 1 B" (:address compacted-contact))
        (should= "40720" (:postal-number compacted-contact))
        (should= "JYVÄSKYLÄ 2" (:city compacted-contact))))

  (it "selects field by language"
    (let [compacted (o/compact-organisation-info :sv (assoc organisation
                                                            :yhteystiedot
                                                            [{:kieli "kieli_sv#1"
                                                              :email "info@abo.fi"}
                                                             {:kieli "kieli_fi#1"
                                                              :email "info@turku.fi"}]))]
      (should= "info@abo.fi" (:email compacted))))

  (it "falls back to Finnish language if field with wanted language does not exist"
    (let [compacted (o/compact-organisation-info :sv (assoc organisation
                                                            :yhteystiedot
                                                            [{:kieli "kieli_fi#1"
                                                              :email "info@turku.fi"}]))]
      (should= "info@turku.fi" (:email compacted))))

  (it "falls back to Finnish language if field with wanted language is empty"
    (let [compacted (o/compact-organisation-info :sv (assoc organisation
                                                            :yhteystiedot
                                                            [{:kieli "kieli_sv#1"
                                                              :email ""}
                                                             {:kieli "kieli_fi#1"
                                                              :email "info@turku.fi"}]))]
      (should= "info@turku.fi" (:email compacted))))

  (it "falls back to Finnish language per field"
    (let [compacted (o/compact-organisation-info :sv (assoc organisation
                                                            :yhteystiedot
                                                            [{:kieli "kieli_sv#1"
                                                              :name "Åbo stad"}
                                                             {:kieli "kieli_fi#1"
                                                              :name "Åbo stad"}
                                                             {:kieli "kieli_sv#1"
                                                              :email ""}
                                                             {:kieli "kieli_fi#1"
                                                              :email "info@turku.fi"}]))]
      (should= "Åbo stad" (:name compacted))
      (should= "info@turku.fi" (:email compacted)))))

(run-specs)
