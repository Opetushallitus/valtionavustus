(ns oph.va.virkailija.koodisto
  (:use [clojure.tools.trace])
  (:require [org.httpkit.client :as http]
            [cheshire.core :as cheshire]
            [clojure.string :as str]))

(def koodisto-base-url "https://virkailija.opintopolku.fi:443/koodisto-service/rest/")
(def all-koodisto-groups-path "codes")
(def all-koodistos-group-uri "http://kaikkikoodistot")

(defn json->map [body] (cheshire/parse-string body true))

(defn- fetch-all-koodisto-groups []
  (let [full-koodistos-url (str koodisto-base-url all-koodisto-groups-path)
          {:keys [status headers body error] :as resp} @(http/get full-koodistos-url)]
    (if (= 200 status)
      (json->map body)
      (throw (ex-info "Error when fetching koodisto groups" {:status status
                                                             :url full-koodistos-url
                                                             :body body
                                                             :error error
                                                             :headers headers})))))

(defn- koodisto-groups->uris-and-latest [koodisto-groups]
  (->> koodisto-groups
       (filter #(= all-koodistos-group-uri (:koodistoRyhmaUri %)))
       (first)
       (:koodistos)
       (mapv #(select-keys % [:koodistoUri :latestKoodistoVersio]))))

(defn- extract-name [koodisto-version]
  (->> koodisto-version
       (:latestKoodistoVersio)
       (:metadata)
       (filter #(= "FI" (:kieli %)))
       (filter :nimi)
       (set)
       (mapv :nimi)
       (first)))

(defn- koodisto-version->uri-and-name [koodisto-version]
  {:uri (:koodistoUri koodisto-version)
   :name (extract-name koodisto-version)})

(defn- compare-case-insensitively [s1 s2]
  (compare (str/upper-case s1) (str/upper-case s2)))

(defn list-koodistos []
  (->> (fetch-all-koodisto-groups)
       (koodisto-groups->uris-and-latest)
       (mapv koodisto-version->uri-and-name)
       (sort compare-case-insensitively)))
