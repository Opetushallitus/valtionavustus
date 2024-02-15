(ns oph.va.virkailija.kayttooikeus-service-spec
  (:require [speclj.core :refer :all]
            [oph.va.virkailija.kayttooikeus-service :as kos]
            [cheshire.core :as cheshire]
            [clojure.pprint :as pprint]))



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

(defn- make-response-body [person-data]
  (cheshire/parse-string (cheshire/generate-string  person-data) true))

(describe "Käyttöoikeus service"
          (it "fetches VA person privileges"
              (let [response  (make-response-body [(make-person-data person-oid-1 "ADMIN")])
                    expected  {:person-oid person-oid-1 :privileges ["va-admin"]}]

                (should= expected (kos/parse-person-privileges response  "pvirtane"))))

          (it "returns nil when finding multiple matches"
              (let [response  (make-response-body  (list (make-person-data person-oid-1 "ADMIN")
                                                         (make-person-data person-oid-2 "USER")))]

                (should-be-nil (kos/parse-person-privileges response "pvirtane"))))

          (it "returns nil when finding no matches"
              (let [response  (make-response-body  [])]

                (should-be-nil (kos/parse-person-privileges response "pvirtane"))))

          (it "does not return person with ADMIN privilege in another service"
              (let [response  (make-response-body [(make-person-data person-oid-1 "OTHERSERVICE" "ADMIN")])]
                (should-be-nil (kos/parse-person-privileges response "pvirtane"))))

          (it "returns trimmed person-oid of VA person"
              (let [response (make-response-body [(make-person-data (str " " person-oid-1) "ADMIN")])]
                (should= person-oid-1 (:person-oid (kos/parse-person-privileges response "pvirtane")))))

          (it "does not return person with empty person-oid"
              (let [responses (make-response-body [(make-person-data "" "ADMIN")])]
                (should-be-nil (kos/parse-person-privileges responses "pvirtane"))))

          (it "does not return person with empty person-oid after trimming"
              (let [response (make-response-body [(make-person-data " " "ADMIN")])]
                  (should-be-nil (kos/parse-person-privileges response "pvirtane"))))

          (it "fetches all VA people privileges"
              (let [responses (make-response-body [(make-person-data person-oid-1 "ADMIN")
                                                   (make-person-data "42.1" "OTHERSERVICE" "ADMIN")
                                                   (make-person-data person-oid-2 "ADMIN")
                                                   (make-person-data person-oid-2 "USER")
                                                   (make-person-data "" "ADMIN")
                                                   (make-person-data " " "ADMIN")
                                                   (make-person-data "42.2" "OTHERPRIVILEGE")])
                    expected  {person-oid-1 {:privileges ["va-admin"]}
                               person-oid-2 {:privileges ["va-user"]}}]

                  (should= expected (kos/parse-va-people-privileges-from-response responses))))
          )

(run-specs)
