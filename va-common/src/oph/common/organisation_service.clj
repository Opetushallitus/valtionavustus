(ns oph.common.organisation-service
  (:require [org.httpkit.client :as http]
            [cheshire.core :as cheshire]))

(def service-url "https://virkailija.opintopolku.fi/organisaatio-service/rest/")

(def languages {:fi "kieli_fi#1" :sv "kieli_sv#1" :en "kieli_en#1"})

(def postal-address-fields #{:osoite :postinumeroUri :postitoimipaikka :osoiteTyyppi})

(defn- make-contact-field-collector [lang]
  (fn [acc fieldset]
    (let [osoitetyyppi (:osoiteTyyppi fieldset)]
      (if (seq osoitetyyppi)
        (if (not= (:osoiteTyyppi acc) "posti")
          (into acc (filter (fn [[k _]] (postal-address-fields k))) fieldset)
          acc)
        (merge-with (fn [res cur] (if (empty? res) cur res)) acc fieldset)))))

(defn- reduce-contact-fields [lang fieldsets acc]
  (let [fieldsets-in-lang (filter #(= (:kieli %) lang) fieldsets)]
    (reduce (make-contact-field-collector lang)
            acc
            fieldsets-in-lang)))

(defn- json->map [body] (cheshire/parse-string body true))

(defn find-by-id
  "Fetch organisation data by organisation id (Y-tunnus in Finnish)."
  [organisation-id]
  (let [url
        (str service-url "organisaatio/" organisation-id "?includeImage=false")
        {:keys [status body error headers]}
         @(http/get url)]
    (case status
      200 (json->map body)
      404 nil
      (throw (ex-info "Error while fetching organisation info"
                      {:status status :url url :body body
                       :error error :headers headers})))))

(defn compact-address
  "Convert full address info to compact one:
  {:address :postal-number :city}
  Postal addess is being trimmed by removing Finnish tag 'posti_'."
  [{:keys [osoite postinumeroUri postitoimipaikka]}]
  {:address osoite
   :postal-number (clojure.string/replace (str postinumeroUri) "posti_" "")
   :city postitoimipaikka})

(defn compact-organisation-info
  "Function compacts organisation info.
  Values are being filtered by given language and unused values are being
  filtered out.
  Output will be
  {:name :email :organisation-id :county})"
  [lang {:keys [nimi yhteystiedot ytunnus]}]
  (let [translated-contact-by-primary-lang (reduce-contact-fields (lang languages)
                                                                  yhteystiedot
                                                                  {})
        translated-contact                 (if (= :fi lang)
                                             translated-contact-by-primary-lang
                                             (reduce-contact-fields (:fi languages)
                                                                    yhteystiedot
                                                                    translated-contact-by-primary-lang))]
    {:name            (or (lang nimi) (:fi nimi))
     :email           (:email translated-contact)
     :organisation-id ytunnus
     :contact         (compact-address translated-contact)
     :county          nil}))

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
  {:name :email :organisation-id :county}

  If no organisation is found nil will be returned.

  If remote server returns error exception will be thrown. Compojure API should
  handle this exception."
  ([id lang]
   (let [organisation-info (find-by-id id)]
     (when organisation-info (compact-organisation-info lang organisation-info))))
  ([id]
   (get-compact-translated-info id :fi)))
