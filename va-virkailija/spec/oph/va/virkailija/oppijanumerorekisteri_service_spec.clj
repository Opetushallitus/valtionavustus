(ns oph.va.virkailija.oppijanumerorekisteri-service-spec
  (:require [speclj.core :refer :all]
            [oph.va.virkailija.fake-http :as fake-http]
            [oph.va.virkailija.url :as url]
            [oph.va.virkailija.oppijanumerorekisteri-service :as onrs]))

(defmacro with-fake-service-client [responses & body]
  `(fake-http/with-fake-http-client onrs/service-client ~responses ~@body))

(def person-oid-1 "1.22.333.4444.24.10000000001")

(def person-oid-2 "1.22.333.4444.24.10000000002")

(def lang-name-data
  {:fi "suomi"
   :sv "ruotsi"})

(def contact-info-data
  {:email "YHTEYSTIETO_SAHKOPOSTI"
   :phone "YHTEYSTIETO_PUHELIN"})

(defn- make-lang-data [lang-code]
  (when lang-code
    {"kieliKoodi"  (name lang-code)
     "kieliTyyppi" (get lang-name-data lang-code)}))

(defn- make-contact-info-data [id info]
  {"id"          (+ 310000 id)
   "yhteystieto" (list {"yhteystietoTyyppi" (get contact-info-data (:type info))
                        "yhteystietoArvo"   (:value info)})})

(defn- make-user-data [{:keys [person-oid native-lang business-lang contact-infos]}]
  {"oidHenkilo"        person-oid
   "etunimet"          "Jarmo Pekka"
   "kutsumanimi"       "Pekka"
   "sukunimi"          "Virtanen"
   "aidinkieli"        (make-lang-data native-lang)
   "asiointiKieli"     (make-lang-data business-lang)
   "yhteystiedotRyhma" (map-indexed make-contact-info-data contact-infos)})

(describe "Oppijanumerorekisteri service"
  (it "fetches person"
      (let [user-data (make-user-data {:person-oid    person-oid-1
                                       :native-lang   :fi
                                       :business-lang :sv
                                       :contact-infos [{:value "pvirt@example.com" :type :email}]})
            expected  {:first-name "Pekka"
                       :surname    "Virtanen"
                       :lang       "sv"
                       :email      "pvirt@example.com"}]
        (with-fake-service-client {(onrs/make-person-url person-oid-1) user-data}
          (should= expected (onrs/get-person person-oid-1)))))

  (it "fetching person selects first non-nil lang"
      (let [user-data (make-user-data {:person-oid  person-oid-1
                                       :native-lang :sv})]
        (with-fake-service-client {(onrs/make-person-url person-oid-1) user-data}
          (should= "sv" (:lang (onrs/get-person person-oid-1))))))

  (it "fetching person falls back to fi lang if no other language was found"
      (let [user-data (make-user-data {:person-oid person-oid-1})]
        (with-fake-service-client {(onrs/make-person-url person-oid-1) user-data}
          (should= "fi" (:lang (onrs/get-person person-oid-1))))))

  (it "fetching person selects first email available"
      (let [user-data (make-user-data {:person-oid    person-oid-1
                                       :contact-infos [{:value "0501001001"         :type :phone}
                                                       {:value "pvirt1@example.com" :type :email}
                                                       {:value "pvirt2@example.com" :type :email}]})]
        (with-fake-service-client {(onrs/make-person-url person-oid-1) user-data}
          (should= "pvirt1@example.com" (:email (onrs/get-person person-oid-1))))))

  (it "fetches many persons"
      (let [users-data {person-oid-1 (make-user-data {:person-oid    person-oid-1
                                                      :native-lang   :fi
                                                      :business-lang :sv
                                                      :contact-infos [{:value "pvirt1@example.com" :type :email}]})
                        person-oid-2 (make-user-data {:person-oid    person-oid-2
                                                      :native-lang   :sv
                                                      :business-lang :fi
                                                      :contact-infos [{:value "pvirt2@example.com" :type :email}]})}
            expected   (list {:first-name "Pekka"
                              :surname    "Virtanen"
                              :lang       "sv"
                              :email      "pvirt1@example.com"}
                             {:first-name "Pekka"
                              :surname    "Virtanen"
                              :lang       "fi"
                              :email      "pvirt2@example.com"})]
        (with-fake-service-client {(onrs/make-person-url person-oid-1) (get users-data person-oid-1)
                                   (onrs/make-person-url person-oid-2) (get users-data person-oid-2)}
          (should= expected (onrs/get-people [person-oid-1 person-oid-2]))))))
