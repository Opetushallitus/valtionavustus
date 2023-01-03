(ns oph.va.virkailija.kayttooikeus-service-spec
  (:require [speclj.core :refer :all]
            [oph.va.virkailija.fake-http :as fake-http]
            [oph.va.virkailija.url :as url]
            [oph.va.virkailija.kayttooikeus-service :as kos]))

(defmacro with-fake-service-client [responses & body]
  `(fake-http/with-fake-http-client kos/service-client ~responses ~@body))

(def person-oid-1 "1.22.333.4444.24.10000000001")

(def person-oid-2 "1.22.333.4444.24.10000000002")

(defn- make-person-data
  ([person-oid privilege]
   (make-person-data person-oid "VALTIONAVUSTUS" privilege))

  ([person-oid service privilege]
   {"oidHenkilo"    person-oid
    "organisaatiot" [{"organisaatioOid" "1.2.246.562.10.00000000001",
                      "kayttooikeudet"  [{"palvelu" service,
                                          "oikeus"  privilege}]}]}))

(describe "Käyttöoikeus service"
  (it "fetches VA person privileges"
      (let [responses {(kos/make-person-kayttooikeus-url {:username "pvirtane"}) [(make-person-data person-oid-1 "ADMIN")]}
            expected  {:person-oid person-oid-1 :privileges ["va-admin"]}]
        (with-fake-service-client responses
          (should= expected (kos/get-va-person-privileges "pvirtane")))))

  (it "returns nil when finding multiple matches"
      (let [responses {(kos/make-person-kayttooikeus-url {:username "pvirtane"}) [(make-person-data person-oid-1 "ADMIN")
                                                                                  (make-person-data person-oid-2 "USER")]}]
        (with-fake-service-client responses
          (should-be-nil (kos/get-va-person-privileges "pvirtane")))))

  (it "returns nil when finding no matches"
      (let [responses {(kos/make-person-kayttooikeus-url {:username "pvirtane"}) []}]
        (with-fake-service-client responses
          (should-be-nil (kos/get-va-person-privileges "pvirtane")))))

  (it "does not return person with ADMIN privilege in another service"
      (let [responses {(kos/make-person-kayttooikeus-url {:username "pvirtane"}) [(make-person-data person-oid-1 "OTHERSERVICE" "ADMIN")]}]
        (with-fake-service-client responses
          (should-be-nil (kos/get-va-person-privileges "pvirtane")))))

  (it "returns trimmed person-oid of VA person"
      (let [responses {(kos/make-person-kayttooikeus-url {:username "pvirtane"}) [(make-person-data (str " " person-oid-1) "ADMIN")]}]
        (with-fake-service-client responses
          (should= person-oid-1 (:person-oid (kos/get-va-person-privileges "pvirtane"))))))

  (it "does not return person with empty person-oid"
      (let [responses {(kos/make-person-kayttooikeus-url {:username "pvirtane"}) [(make-person-data "" "ADMIN")]}]
        (with-fake-service-client responses
          (should-be-nil (kos/get-va-person-privileges "pvirtane")))))

  (it "does not return person with empty person-oid after trimming"
      (let [responses {(kos/make-person-kayttooikeus-url {:username "pvirtane"}) [(make-person-data " " "ADMIN")]}]
        (with-fake-service-client responses
          (should-be-nil (kos/get-va-person-privileges "pvirtane")))))

  (it "fetches all VA people privileges"
      (let [responses {(kos/make-person-kayttooikeus-url {:palvelu "VALTIONAVUSTUS"}) [(make-person-data person-oid-1 "ADMIN")
                                                                                       (make-person-data "42.1" "OTHERSERVICE" "ADMIN")
                                                                                       (make-person-data person-oid-2 "ADMIN")
                                                                                       (make-person-data person-oid-2 "USER")
                                                                                       (make-person-data "" "ADMIN")
                                                                                       (make-person-data " " "ADMIN")
                                                                                       (make-person-data "42.2" "OTHERPRIVILEGE")]}
            expected  {person-oid-1 {:privileges ["va-admin"]}
                       person-oid-2 {:privileges ["va-user"]}}]
        (with-fake-service-client responses
          (should= expected (kos/get-va-people-privileges))))))

(run-specs)
