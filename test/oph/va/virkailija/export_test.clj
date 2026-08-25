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
   {:organization-name "Toinen Organisaatio Oy"
    :contact-person "Toka Päivitetty"
    :email "toka.paivitetty@toinen.fi"}])

(deftest patch-yhteishanke-answer-map-test
  (testing "patches contacts when organization names and order match"
    (let [actual (export/patch-yhteishanke-answer-map original-answers updated-organizations)]
      (is (= "Ensimmäinen Organisaatio Oy"
             (get actual "other-organizations.other-organizations-1.name")))
      (is (= "Eka Päivitetty"
             (get actual "other-organizations.other-organizations-1.contactperson")))
      (is (= "eka.paivitetty@ensimmainen.fi"
             (get actual "other-organizations.other-organizations-1.email")))
      (is (= "Toka Päivitetty"
             (get actual "other-organizations.other-organizations-2.contactperson")))
      (is (= "toka.paivitetty@toinen.fi"
             (get actual "other-organizations.other-organizations-2.email")))
      (is (= "säilyy" (get actual "unrelated-answer")))))

  (testing "keeps original nonblank contacts when normalized values are blank"
    (let [organizations (assoc-in updated-organizations [0 :contact-person] "")
          actual (export/patch-yhteishanke-answer-map original-answers organizations)]
      (is (= "Eka Henkilö"
             (get actual "other-organizations.other-organizations-1.contactperson")))))

  (testing "keeps answers unchanged when normalized organizations are missing"
    (is (= original-answers
           (export/patch-yhteishanke-answer-map original-answers []))))

  (testing "keeps all original organization answers when counts differ"
    (is (= original-answers
           (export/patch-yhteishanke-answer-map original-answers
                                                (subvec updated-organizations 0 1)))))

  (testing "keeps all original organization answers when a name differs"
    (let [organizations (assoc-in updated-organizations [0 :organization-name] "Uusi Ry")]
      (is (= original-answers
             (export/patch-yhteishanke-answer-map original-answers organizations)))))

  (testing "keeps all original organization answers when order differs"
    (is (= original-answers
           (export/patch-yhteishanke-answer-map original-answers
                                                (vec (reverse updated-organizations)))))))
