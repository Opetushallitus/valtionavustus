(ns oph.common.organisation-service
  (:require [org.httpkit.client :as http]
            [cheshire.core :as cheshire]))

(def service-url "https://virkailija.opintopolku.fi/organisaatio-service/rest/")

(def languages {:fi "kieli_fi#1" :sv "kieli_sv#1" :en "kieli_en#1" })

(def compact-contact-fields #{ :osoite :postinumeroUri :postitoimipaikka })

(defn filter-translations
  "Filter vector collection of values by translation.
  Collections of 'organisaatio-service' has :kieli key defining translation."
  [lang col]
    (not-empty (filter #(= (:kieli %) (lang languages)) col)))

(defn- json->map [body] (cheshire/parse-string body true))

(defn find-by-id
  "Fetch organisation data by organisation id (Y-tunnus in Finnish)."
  [organisation-id]
  (let [url
        (str service-url "organisaatio/" organisation-id "?includeImage=false")]
    (json->map (:body @(http/get url)))))

(defn compact-address
  "Convert full address info to compact one:
  {:address :postal-number :city}
  Postal addess is being trimmed by removing Finnish tag 'posti_'."
  [{:keys [osoite postinumeroUri postitoimipaikka]}]
  {:address osoite
     :postal-number (clojure.string/replace postinumeroUri "posti_" "")
     :city postitoimipaikka})

(defn compact-organisation-info
  "Function compacts organisation info.
  Values are being filtered by given language and unused values are being
  filtered out.
  Output will be
  {:name :email :organisation-id :county})"
  [lang {:keys [nimi yhteystiedot ytunnus]}]
  (let [translated-contact
        (into {} (or
                   (filter-translations lang yhteystiedot)
                   (filter-translations :fi yhteystiedot)))]
    {:name (or (lang nimi) (:fi nimi))
     :email (:email translated-contact)
     :organisation-id ytunnus
     :contact (compact-address translated-contact)
     :county nil}))

(defn get-compact-translated-info
  "Get (find) organisation with given organisation id (Y-tunnus in Finnish)
  and compact info to contain only necessary data. Data will be in following:
  {:name, :email, :organisation-id, :contact {:address, :postal-number, :city},
  :county}.

  You can also give language. If data is found in given language, translated
  info will be returned. Otherwise it will be in Finnish.

  Language can be {:fi, :sv, :en}

  Function assumes name and contact info are translated.

  Data will be in form of
  {:name :email :organisation-id :county}" 
  ([id lang]
   (compact-organisation-info lang (find-by-id id)))
  ([id]
   (get-compact-translated-info id :fi)))
