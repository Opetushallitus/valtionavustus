(ns oph.va.virkailija.oppijanumerorekisteri-service
  (:require [clojure.data.json :as json]
            [clojure.string :as str :refer [includes?]]
            [oph.common.caller-id :as caller-id]
            [oph.soresu.common.config :refer [config]]
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
  (let [emails    (->> (:yhteystiedotRyhma person)
                       (mapcat :yhteystieto)
                       (filter (fn [c] (and (= (:yhteystietoTyyppi c) "YHTEYSTIETO_SAHKOPOSTI")
                                            (seq (:yhteystietoArvo c)))))
                       (map :yhteystietoArvo))
        oph-email (some #(when (re-find #"(?i)@oph\.fi" %) %) emails)]
    (or oph-email (first emails))))

(defn make-person-url [person-oid]
  (str service-base-url
       "/henkilo/"
       (url/encode person-oid)))

(defn person->va-user-info [person]
  {:first-name (:kutsumanimi person)
   :surname    (:sukunimi person)
   :lang       (find-person-lang person)
   :email      (find-person-email person)})

(defn get-tgt []
  (let [opintopolku-url (-> config :opintopolku :url)
        username (get-in config [:opintopolku :cas-service-username])
        password (get-in config [:opintopolku :cas-service-password])
        tgt-response @(hk-client/post (str opintopolku-url "/cas/v1/tickets") {:form-params {:username username :password password}})
        location-header (-> tgt-response :headers :location)
        tgt (re-find (re-pattern "TGT-.*") location-header)]
    tgt))
(defn get-st [tgt]
  (let [opintopolku-url (-> config :opintopolku :url)
        service (str service-base-url "/j_spring_cas_security_check")
        st-res @(hk-client/post (str opintopolku-url "/cas/v1/tickets/" tgt) {:query-params {:service service} :headers {"caller-id" caller-id/caller-id
                                                                                                                         "CSRF" caller-id/caller-id}})
        st (slurp (:body st-res))]
    st))

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
        st (get-st tgt)
        first-person-response (get-person-req first-oid st)
        cookies (str (-> first-person-response :headers :set-cookie))
        jsession-id  (first (filter (fn [x] (includes? x "JSESSIONID")) (str/split cookies #";")))
        rest-oids (rest person-oids)
        futures (doall (map (fn [x] (get-person-req-with-cookie-promise x jsession-id)) rest-oids))]
    (handle-first-and-futures first-person-response futures)))


(defn get-person [person-oid]
  (let [tgt (get-tgt)
        st (get-st tgt)
        person-response (get-person-req person-oid st)]

    (try-response->va-user-info person-response)))

(defn get-people [person-oids]
  (get-all-people person-oids))
