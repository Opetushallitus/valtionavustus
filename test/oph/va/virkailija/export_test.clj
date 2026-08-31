(ns oph.va.virkailija.export-test
  (:require [clojure.test :refer [deftest is testing]]
            [oph.va.virkailija.export :as export]))

(def original-answers
  {"other-organizations.other-organizations-1.name" "Ensimmäinen Organisaatio Oy"
   "other-organizations.other-organizations-1.contactperson" "Eka Henkilö"
   "other-organizations.other-organizations-1.email" "eka@ensimmainen.fi"
   "other-organizations.other-organizations-2.name" "Toinen Organisaatio Oy"
   "other-organizations.other-organizations-2.contactperson" "Toka Henkilö"
   "other-organizations.other-organizations-2.email" "toka@toinen.fi"
   "unrelated-answer" "säilyy"})

(def updated-organizations
  [{:organization-name "Ensimmäinen Organisaatio Oy"
    :contact-person "Eka Päivitetty"
    :email "eka.paivitetty@ensimmainen.fi"}
   {:organization-name "Toinen Osapuoli"
    :contact-person "Toinen Testihenkilö"
    :email "toinen.testihenkilo@example.com"}
   {:organization-name "Kolmas Testiorganisaatio Oy"
    :contact-person "Kolmas Testihenkilö"
    :email "kolmas.testihenkilo@example.com"}])

(deftest patch-yhteishanke-answer-map-test
  (testing "replaces organization names and contacts with the complete current list"
    (let [actual (export/patch-yhteishanke-answer-map original-answers updated-organizations)]
      (is (= "Ensimmäinen Organisaatio Oy"
             (get actual "other-organizations.other-organizations-1.name")))
      (is (= "Eka Päivitetty"
             (get actual "other-organizations.other-organizations-1.contactperson")))
      (is (= "eka.paivitetty@ensimmainen.fi"
             (get actual "other-organizations.other-organizations-1.email")))
      (is (= "Toinen Osapuoli"
             (get actual "other-organizations.other-organizations-2.name")))
      (is (= "Toinen Testihenkilö"
             (get actual "other-organizations.other-organizations-2.contactperson")))
      (is (= "toinen.testihenkilo@example.com"
             (get actual "other-organizations.other-organizations-2.email")))
      (is (= "Kolmas Testiorganisaatio Oy"
             (get actual "other-organizations.other-organizations-3.name")))
      (is (= "Kolmas Testihenkilö"
             (get actual "other-organizations.other-organizations-3.contactperson")))
      (is (= "kolmas.testihenkilo@example.com"
             (get actual "other-organizations.other-organizations-3.email")))
      (is (= "säilyy" (get actual "unrelated-answer")))))

  (testing "keeps original answers as a legacy fallback when current organizations are missing"
    (is (= original-answers
           (export/patch-yhteishanke-answer-map original-answers []))))

  (testing "removes values for organizations missing from the current list"
    (let [actual (export/patch-yhteishanke-answer-map original-answers
                                                      (subvec updated-organizations 0 1))]
      (is (= "Ensimmäinen Organisaatio Oy"
             (get actual "other-organizations.other-organizations-1.name")))
      (is (not (contains? actual "other-organizations.other-organizations-2.name")))
      (is (not (contains? actual "other-organizations.other-organizations-2.contactperson")))
      (is (not (contains? actual "other-organizations.other-organizations-2.email")))))

  (testing "exports the current organization order"
    (let [organizations (vec (reverse updated-organizations))
          actual (export/patch-yhteishanke-answer-map original-answers organizations)]
      (is (= "Kolmas Testiorganisaatio Oy"
             (get actual "other-organizations.other-organizations-1.name")))
      (is (= "Ensimmäinen Organisaatio Oy"
             (get actual "other-organizations.other-organizations-3.name"))))))

(def original-growing-fieldset-lut
  {"other-organizations"
   (array-map
    "other-organizations-1"
    ["other-organizations.other-organizations-1.name"
     "other-organizations.other-organizations-1.contactperson"
     "other-organizations.other-organizations-1.email"]
    "other-organizations-2"
    ["other-organizations.other-organizations-2.name"
     "other-organizations.other-organizations-2.contactperson"
     "other-organizations.other-organizations-2.email"])})

(deftest resize-yhteishanke-growing-fieldset-lut-test
  (testing "adds field definitions for current organizations"
    (let [actual (export/resize-yhteishanke-growing-fieldset-lut original-growing-fieldset-lut 3)]
      (is (= ["other-organizations-1"
              "other-organizations-2"
              "other-organizations-3"]
             (keys (get actual "other-organizations"))))
      (is (= ["other-organizations.other-organizations-3.name"
              "other-organizations.other-organizations-3.contactperson"
              "other-organizations.other-organizations-3.email"]
             (get-in actual ["other-organizations" "other-organizations-3"])))))

  (testing "removes field definitions beyond the current maximum"
    (let [actual (export/resize-yhteishanke-growing-fieldset-lut original-growing-fieldset-lut 1)]
      (is (= ["other-organizations-1"]
             (keys (get actual "other-organizations")))))))
