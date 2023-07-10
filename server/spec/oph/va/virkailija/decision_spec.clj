(ns oph.va.virkailija.decision-spec
  (:require [speclj.core
             :refer [describe it should= should-contain tags run-specs around-all]]
            [clojure.java.io :as io]
            [oph.common.testing.spec-plumbing :refer [with-test-server!]]
            [oph.va.virkailija.server :refer [start-virkailija-server]]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.va.virkailija.decision :as d]
            [clojure.data.json :as json]
            [oph.va.virkailija.hakudata :as hakudata]
            [oph.va.virkailija.common-utils
             :refer [test-server-port create-submission create-application
                     create-application-evaluation]])
  (:import (java.time LocalDate)))

(def translations-str (slurp (io/resource "public/translations.json")))
(def translations (json/read-str translations-str :key-fn keyword))
(def translate (partial d/decision-translation translations :fi))
(def translate-sv (partial d/decision-translation translations :sv))

(def grant-payment-fields-single
  {:decision {:maksudate "20.6.2018"
              :maksu {:fi "Avustus maksetaan noin kuukauden kuluessa päätöksestä."
                      :sv "Understödet utbetalas till bankkontot ca en månad efter att beslutet fattats"}}
   :content {:multiplemaksuera false}})

(def grant-payment-fields-multi
  {:decision {:maksudate "31.12.2018"
              :maksu {:fi "28.2.2018 mennessä"
                      :sv "Senast 28.2.2018"}}
   :content {:multiplemaksuera true
             :payment-size-limit "no-limit"
             :payment-min-first-batch 60}})

(def answers {:value [{:fieldType "iban"
                       :key "bank-iban"
                       :value "FI49 5000 9420 0287 30"}
                      {:fieldType "bic"
                       :key "bank-bic"
                       :value "OKOYFIHH"}]})

(describe
  "Decision rendering"

  (tags :decision)

  (around-all [_] (with-test-server! "virkailija"
                    #(start-virkailija-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false}) (_)))

  (it "gets payment HTML section in single batch payment"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission (:form grant) answers)
            application (create-application grant submission)]
        (create-application-evaluation
          application "accepted" {:talousarviotili nil})

        (let [data (hakudata/get-combined-paatos-data (:id application))]
          (should=
            "<section class=\"section\"><h2>Avustuksen maksu</h2><div class=\"content\"><span><span><p>Avustus maksetaan hakijan ilmoittamalle pankkitilille:</p><p><strong>FI49 5000 9420 0287 30, OKOYFIHH</strong></p></span><p>Maksuerät ja -ajat: 30 000 € Avustus maksetaan noin kuukauden kuluessa päätöksestä..</p></span></div></section>"
            (d/avustuksen-maksu
              (merge grant grant-payment-fields-single)
              (assoc-in (:hakemus data) [:arvio :budget-granted] 30000)
              translate)))))

  (it "gets payment section in single batch payments"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission (:form grant) answers)
            application (create-application grant submission)]
        (create-application-evaluation
          application "accepted" {:talousarviotili nil})

        (let [data (hakudata/get-combined-paatos-data (:id application))]
          (should=
            [:span [:span [:p "Avustus maksetaan hakijan ilmoittamalle pankkitilille" ":"] [:p [:strong "FI49 5000 9420 0287 30" ", " "OKOYFIHH"]]] [:p "Maksuerät ja -ajat" ": " "30 000 €" " " "Avustus maksetaan noin kuukauden kuluessa päätöksestä." "."] nil]
            (d/generate-payment-decision
              {:grant (merge grant grant-payment-fields-single)
               :application (assoc-in (:hakemus data)
                                      [:arvio :budget-granted] 30000)
               :translate translate})))))

  (it "gets payment section in single batch payments with TaKP"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission (:form grant) answers)
            application (create-application grant submission)]
        (create-application-evaluation application "accepted")

        (let [data (hakudata/get-combined-paatos-data (:id application))]
          (should=
            [:span [:span [:p "Avustus maksetaan hakijan ilmoittamalle pankkitilille" ":"] [:p [:strong "FI49 5000 9420 0287 30" ", " "OKOYFIHH"]]] [:p "Maksuerät ja -ajat" ": " "30 000 €" " " "Avustus maksetaan noin kuukauden kuluessa päätöksestä." "."] [:p "Talousarviotili" ": " "29103013"]]
            (d/generate-payment-decision
              {:grant (merge grant grant-payment-fields-single)
               :application (assoc-in (:hakemus data)
                                      [:arvio :budget-granted] 30000)
               :translate translate})))))

  (it "gets payment HTML section in multi batch payment"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission (:form grant) answers)
            application (create-application grant submission)]
        (create-application-evaluation
          application "accepted" {:budget-granted 200000
                                  :costsGranted 200000
                                  :talousarviotili nil})

        (let [data (hakudata/get-combined-paatos-data (:id application))]
          (should=
            "<section class=\"section\"><h2>Avustuksen maksu</h2><div class=\"content\"><span><span><p>Avustus maksetaan hakijan ilmoittamalle pankkitilille:</p><p><strong>FI49 5000 9420 0287 30, OKOYFIHH</strong></p></span><p>Maksuerät ja -ajat: 120 000 € 28.2.2018 mennessä ja loppuerä viimeistään 31.12.2018</p></span></div></section>"
            (d/avustuksen-maksu
              (merge grant grant-payment-fields-multi)
              (assoc-in (:hakemus data) [:arvio :budget-granted] 200000)
              translate)))))

  (it "gets payment section in multi batch payments"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission (:form grant) answers)
            application (create-application grant submission)]
        (create-application-evaluation
          application "accepted" {:budget-granted 200000
                                  :costsGranted 200000
                                  :talousarviotili nil})

        (let [data (hakudata/get-combined-paatos-data (:id application))]
          (should=
            [:span [:span [:p "Avustus maksetaan hakijan ilmoittamalle pankkitilille" ":"] [:p [:strong "FI49 5000 9420 0287 30" ", " "OKOYFIHH"]]] [:p "Maksuerät ja -ajat" ": " "120 000 €" " " "28.2.2018 mennessä" " ja loppuerä viimeistään 31.12.2018"] nil]
            (d/generate-payment-decision
              {:grant (merge grant grant-payment-fields-multi)
               :application (assoc-in (:hakemus data)
                                      [:arvio :budget-granted] 200000)
               :translate translate})))))

  (it "gets payment section in multi batch payments with TaKP"
      (let [grant (first (grant-data/get-grants))
            submission (create-submission (:form grant) answers)
            application (create-application grant submission)]
        (create-application-evaluation
          application "accepted" {:budget-granted 200000
                                  :costsGranted 200000})

        (let [data (hakudata/get-combined-paatos-data (:id application))]
          (should=
            [:span [:span [:p "Avustus maksetaan hakijan ilmoittamalle pankkitilille" ":"] [:p [:strong "FI49 5000 9420 0287 30" ", " "OKOYFIHH"]]] [:p "Maksuerät ja -ajat" ": " "120 000 €" " " "28.2.2018 mennessä" " ja loppuerä viimeistään 31.12.2018"] [:p "Talousarviotili" ": " "29103013"]]
            (d/generate-payment-decision
              {:grant (merge grant grant-payment-fields-multi)
               :application (assoc-in (:hakemus data)
                                      [:arvio :budget-granted] 200000)
               :translate translate})))))

  (it "gets correct start and end dates in Käyttöaika section"
      (let [avustushaku {:hankkeen-alkamispaiva (LocalDate/parse "2020-12-31")
                         :hankkeen-paattymispaiva (LocalDate/parse "2021-12-31")}
            actual (d/kayttoaika-section avustushaku translate)]
        (should-contain "Avustuksen ensimmäinen käyttöpäivä 31.12.2020" actual)
        (should-contain "Avustuksen viimeinen käyttöpäivä 31.12.2021" actual)))

  (it "gets correct data in Selvitysvelvollisuus section in finnish"
      (let [avustushaku {:translate         translate
                         :language          :fi
                         :valiselvitysdate  (LocalDate/parse "2023-12-31")
                         :loppuselvitysdate (LocalDate/parse "2024-12-31")
                         :decision          {:selvitysvelvollisuus {:fi "Selvitysvelvollisuus fi"
                                                                    :sv "Selvitysvelvollisuus sv"}}}

            actual (d/selvitysvelvollisuus-section avustushaku)]
        (should-contain "Väliselvitys toimitettava viimeistään 31.12.2023" actual)
        (should-contain "Loppuselvitys toimitettava viimeistään 31.12.2024" actual)
        (should-contain "Selvitysvelvollisuus fi" actual)))
  (it "gets correct data in Selvitysvelvollisuus section in swedish"
      (let [avustushaku {:translate         translate-sv
                         :language          :sv
                         :valiselvitysdate  (LocalDate/parse "2023-12-31")
                         :loppuselvitysdate (LocalDate/parse "2024-12-31")
                         :decision          {:selvitysvelvollisuus {:fi "Selvitysvelvollisuus fi"
                                                                    :sv "Selvitysvelvollisuus sv"}}}

            actual (d/selvitysvelvollisuus-section avustushaku)]
        (should-contain "Mellanredovisningen ska lämnas senast 31.12.2023" actual)
        (should-contain "Slutredovisningen ska lämnas senast 31.12.2024" actual)
        (should-contain "Selvitysvelvollisuus sv" actual))))

(run-specs)
