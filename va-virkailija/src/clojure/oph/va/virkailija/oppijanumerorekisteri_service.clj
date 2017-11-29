(ns oph.va.virkailija.oppijanumerorekisteri-service
  (:require [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.cas :as cas]
            [oph.va.virkailija.http :as http]
            [oph.va.virkailija.url :as url]))

(def service-base-url
  (when-not *compile-files*
    (str (get-in config [:opintopolku :url]) "/oppijanumerorekisteri-service")))

(def ^:private service-client
  (when-not *compile-files*
    (delay (http/make-http-client (cas/make-cas-authenticating-client service-base-url)))))

(defn- find-person-lang [person]
  (let [found (as-> person $
                (select-keys $ [:asiointiKieli :aidinkieli])
                (vals $)
                (keep :kieliKoodi $)
                (first $))]
    (or found "fi")))

(defn- find-person-email [person]
  (->> (:yhteystiedotRyhma person)
       (mapcat :yhteystieto)
       (filter (fn [c] (and (= (:yhteystietoTyyppi c) "YHTEYSTIETO_SAHKOPOSTI")
                            (seq (:yhteystietoArvo c)))))
       (map :yhteystietoArvo)
       first))

(defn make-person-url [person-oid]
  (str service-base-url
       "/henkilo/"
       (url/encode person-oid)))

(defn person->va-user-info [person]
  {:first-name (:kutsumanimi person)
   :surname    (:sukunimi person)
   :lang       (find-person-lang person)
   :email      (find-person-email person)})

(defn get-person [person-oid]
  (let [found (http/client-get-json @service-client (make-person-url person-oid))]
    (person->va-user-info found)))

(defn get-people [person-oids]
  (->> person-oids
       (map make-person-url)
       (http/client-pget-json @service-client)
       (map (fn [r]
              (cond (http/response-exception? 404 r) nil
                    (instance? Exception r)          (throw r)
                    :else                            (person->va-user-info r))))))
