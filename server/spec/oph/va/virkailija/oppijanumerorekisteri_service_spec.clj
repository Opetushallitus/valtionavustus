(ns oph.va.virkailija.oppijanumerorekisteri-service-spec
  (:require [cheshire.core :as cheshire]
            [oph.va.virkailija.oppijanumerorekisteri-service :as onrs]
            [speclj.core :refer :all]))


(def person-oid-1 "1.22.333.4444.24.10000000001")

(def person-oid-2 "1.22.333.4444.24.10000000002")

(def lang-name-data
  {:fi "suomi"
   :sv "ruotsi"})

(def contact-info-data
  {:email "YHTEYSTIETO_SAHKOPOSTI"
   :phone "YHTEYSTIETO_PUHELIN"})

(defn- make-mock-response [body]
  {:opts
   {:query-params
    {:ticket "ST-123"},
    :headers {"caller-id" "1.2.246.562.10.00000000001.valtionavustus"},
    :method :get,
    :url
    "https://virkailija.testiopintopolku.fi/oppijanumerorekisteri-service/henkilo/123"},
   :body
   (cheshire/generate-string body),
   :headers
   {:date "Wed, 14 Feb 2024 14:50:47 GMT",
    :content-disposition "inline;filename=f.txt",
    :x-xss-protection "1; mode=block",
    :x-content-type-options "nosniff",
    :server "nginx",
    :x-robots-tag "noindex, nofollow, noarchive",
    :x-frame-options "SAMEORIGIN",
    :strict-transport-security "max-age=16180339; includeSubDomains",
    :content-type "application/json",
    :content-encoding "gzip",
    :connection "keep-alive",
    :transfer-encoding "chunked",
    :set-cookie
    "JSESSIONID=123; Path=/oppijanumerorekisteri-service; Secure; HttpOnly; SameSite=Lax"},
   :status 200})

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
                (should= expected (onrs/try-response->va-user-info  (make-mock-response user-data)))))

          (it "fetching person selects first non-nil lang"
              (let [user-data (make-user-data {:person-oid  person-oid-1
                                               :native-lang :sv})]

                (should= "sv" (:lang (onrs/try-response->va-user-info   (make-mock-response user-data))))))

          (it "fetching person falls back to fi lang if no other language was found"
              (let [user-data (make-user-data {:person-oid person-oid-1})]
                (should= "fi" (:lang (onrs/try-response->va-user-info   (make-mock-response user-data))))))

          (it "fetching person selects oph.fi email if available"
              (let [user-data (make-user-data {:person-oid    person-oid-1
                                               :contact-infos [{:value "0501001001"         :type :phone}
                                                               {:value "pvirt1@example.com" :type :email}
                                                               {:value "pvirt2@oph.fi" :type :email}]})]
                (should= "pvirt2@oph.fi" (:email (onrs/try-response->va-user-info   (make-mock-response user-data))))))

          (it "fetching person selects first email if oph.fi address not available"
              (let [user-data (make-user-data {:person-oid    person-oid-1
                                               :contact-infos [{:value "0501001001"         :type :phone}
                                                               {:value "pvirt1@example.com" :type :email}
                                                               {:value "pvirt2@example.com" :type :email}]})]
                  (should= "pvirt1@example.com" (:email (onrs/try-response->va-user-info   (make-mock-response user-data))))))

          (it "fetches many persons"
              (let [users-data {person-oid-1 (make-user-data {:person-oid    person-oid-1
                                                              :native-lang   :fi
                                                              :business-lang :sv
                                                              :contact-infos [{:value "pvirt1@example.com" :type :email}]})
                                person-oid-2 (make-user-data {:person-oid    person-oid-2
                                                              :native-lang   :sv
                                                              :business-lang :fi
                                                              :contact-infos [{:value "pvirt2@example.com" :type :email}]})}
                    futures (map (fn [x] (future x)) (list (make-mock-response (get users-data person-oid-2))))

                    expected   (list {:first-name "Pekka"
                                      :surname    "Virtanen"
                                      :lang       "sv"
                                      :email      "pvirt1@example.com"}
                                     {:first-name "Pekka"
                                      :surname    "Virtanen"
                                      :lang       "fi"
                                      :email      "pvirt2@example.com"})]


                (should= expected (onrs/handle-first-and-futures (make-mock-response (get users-data person-oid-1)) futures))))

          )
