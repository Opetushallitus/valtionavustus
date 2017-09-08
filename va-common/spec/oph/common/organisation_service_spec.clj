(ns oph.common.organisation-service-spec
  (:require [speclj.core :refer :all]
            [oph.common.organisation-service :as o]))

(def
  contact-collection
  [{:kieli "kieli_sv#1" :email "turun.kaupunki@turku.fi" }
  {:kieli "kieli_fi#1" :email "turun.kaupunki@turku.fi" }
  {:kieli "kieli_fi#1" :osoite "PL 355" :postinumeroUri "posti_20101"}
  {:kieli "kieli_fi#1" :www "http://www.turku.fi"}
  {:kieli "kieli_fi#1" :numero "02  262 7229" :tyyppi "puhelin"}
  {:kieli "kieli_fi#1" :numero "02-330 000" :tyyppi "faksi"}
  {:postitoimipaikka "ÅBO" :kieli "kieli_sv#1"}
  {:kieli "kieli_sv#1" :osoite "PL 355" :postinumeroUri "posti_20101"}
  {:kieli "kieli_sv#1" :www "http://www.turku.fi"}
  {:kieli "kieli_sv#1" :numero "02-330 000", :tyyppi "puhelin"}
  {:postitoimipaikka "TURKU" :kieli "kieli_fi#1" :osoite "PL 355"}])

(def organisation
  {:nimi {:fi "Turun kaupunki" :sv "Åbo stad"}
   :ytunnus "0204819-8"
   :tyypit ["Koulutustoimija"]
   :yhteystiedot contact-collection})

(describe
  "Filter translations"
  (it "filters translations in collection"
    (let [filtered (o/filter-translations :sv contact-collection)]
      (should-not (empty? filtered))
      (should= 5 (count filtered))
      (should= "ÅBO" (:postitoimipaikka (second filtered ))))
    (let [filtered (o/filter-translations :fi contact-collection)]
      (should-not (empty? filtered))
      (should= 6 (count filtered))
      (should= "TURKU" (:postitoimipaikka (last filtered ))))
    (let [filtered (o/filter-translations :en contact-collection)]
      (should (empty? filtered)))))

(describe
  "Compact address data"
  (it
    "compacts translated address data"
    (let [compacted
          (o/compact-address
            (into {} (o/filter-translations :fi contact-collection)))]
      (should-not (empty? compacted))
      (should= 3 (count compacted))
      (should= "TURKU" (:city compacted)))))

(describe
  "Compact organisation info"
  (it
    "compacts organisation info"
    (let [compacted (o/compact-organisation-info :fi organisation)]
      (should-not (empty? compacted))
      (should= 5 (count compacted))
      (should= "turun.kaupunki@turku.fi" (:email compacted))
      (should= "0204819-8" (:organisation-id compacted))
      (should= "Turun kaupunki" (:name compacted))
      (should-not (empty? (:contact compacted)))
      (should= 3 (count (:contact compacted)))
      (should= "TURKU" (get-in compacted [:contact :city]))
      (should= "PL 355" (get-in compacted [:contact :address]))
      (should= "20101" (get-in compacted [:contact :postal-number])))))

(run-specs)
