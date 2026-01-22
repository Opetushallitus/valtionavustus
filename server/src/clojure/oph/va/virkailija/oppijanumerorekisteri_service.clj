(ns oph.va.virkailija.oppijanumerorekisteri-service
  (:require [clojure.data.json :as json]
            [clojure.string :as str :refer [includes?]]
            [oph.common.caller-id :as caller-id]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.cas :refer [get-st get-tgt]]
            [oph.va.virkailija.url :as url]
            [org.httpkit.client :as hk-client]))

(def service-base-url
  (when-not *compile-files*
    (str (get-in config [:opintopolku :url]) "/oppijanumerorekisteri-service")))

(defn- find-person-lang [person]
  (let [found (as-> person $
                (select-keys $ [:asiointiKieli :aidinkieli])
                (vals $)
                (keep :kieliKoodi $)
                (first $))]
    (or found "fi")))

(defn- find-person-email [person]
  (let [emails      (->> (:yhteystiedotRyhma person)
                         (mapcat :yhteystieto)
                         (filter (fn [c] (and (= (:yhteystietoTyyppi c) "YHTEYSTIETO_SAHKOPOSTI")
                                              (seq (:yhteystietoArvo c)))))
                         (map :yhteystietoArvo))
        oph-email   (some #(when (re-find #"(?i)@oph\.fi" %) %) emails)
        jotpa-email (some #(when (re-find #"(?i)@jotpa\.fi" %) %) emails)]
    (or oph-email jotpa-email (first emails))))

(defn make-person-url [person-oid]
  (str service-base-url
       "/henkilo/"
       (url/encode person-oid)))

(defn person->va-user-info [person]
  {:first-name (:kutsumanimi person)
   :surname    (:sukunimi person)
   :lang       (find-person-lang person)
   :email      (find-person-email person)})

(defn get-person-req [person-oid st]
  (let [res @(hk-client/get (make-person-url person-oid) {:query-params {:ticket st}
                                                          :headers {"caller-id" caller-id/caller-id}})]
    res))
(defn get-person-req-with-cookie-promise [person-oid jsessionid]
  (let [res (hk-client/get (make-person-url person-oid) {:headers {"caller-id" caller-id/caller-id
                                                                   "cookie"  jsessionid}})]
    res))

(defn try-parse-person-from-response [response]
  (try
    (json/read-str (:body response) :key-fn keyword)
    (catch Exception e (throw (Exception. (str "Parsing body from response failed. Response: " response "\nError: " (.getMessage e)))))))

(defn try-response->va-user-info [response]
  (person->va-user-info (try-parse-person-from-response response)))

(defn handle-first-and-futures [first-response futures]
  (conj  (->> futures
              (map deref)
              (map (fn [r]
                     (cond (= (:status r) 404) nil
                           (= (:status r) 200) (try-response->va-user-info r)
                           :else (throw (Exception. (str "Fetching person from oppijanumerorekisteri failed" r)))))))
         (try-response->va-user-info first-response)))

(defn get-all-people [person-oids]
  (let [first-oid (first person-oids)
        tgt (get-tgt)
        st (get-st tgt service-base-url)
        first-person-response (get-person-req first-oid st)
        cookies (str (-> first-person-response :headers :set-cookie))
        jsession-id  (first (filter (fn [x] (includes? x "JSESSIONID")) (str/split cookies #";")))
        rest-oids (rest person-oids)
        futures (doall (map (fn [x] (get-person-req-with-cookie-promise x jsession-id)) rest-oids))]
    (handle-first-and-futures first-person-response futures)))

(defn get-person [person-oid]
  (let [tgt (get-tgt)
        st (get-st tgt service-base-url)
        person-response (get-person-req person-oid st)]

    (try-response->va-user-info person-response)))

(defn get-people [person-oids]
  (get-all-people person-oids))
