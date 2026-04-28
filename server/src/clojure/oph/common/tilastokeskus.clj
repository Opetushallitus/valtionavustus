(ns oph.common.tilastokeskus
  (:require [org.httpkit.client :as http]
            [cheshire.core :as cheshire]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [oph.soresu.common.config :refer [config]]))

(def ^:private api-base-url
  (when-not *compile-files*
    (get-in config [:tilastokeskus :url])))

(defn- json->vec [body]
  (cheshire/parse-string body true))

(defn hae-yritystiedot
  "Fetch enterprise data from Tilastokeskus by Y-tunnus.
   Returns a map with keys :ytunnus :nimi :toimiala :sektori :pks :oikmuoto,
   or nil if not found or on error."
  [ytunnus]
  (try
    (let [url (str api-base-url ytunnus)
          {:keys [status body error]} @(http/get url {:timeout 5000})]
      (if (and (= status 200) body)
        (let [result (json->vec body)]
          (when (seq result)
            (first result)))
        (do
          (log/warn "Tilastokeskus API returned unexpected status"
                    {:status status :ytunnus ytunnus :error error})
          nil)))
    (catch Exception e
      (log/warn e "Tilastokeskus API call failed" {:ytunnus ytunnus})
      nil)))

(defn sektori->omistajatyyppi
  "Map Tilastokeskus sektori and oikmuoto codes to omistajatyyppi value.
   Rules are evaluated in order — first match wins.
   Returns nil if no mapping matches."
  [sektori oikmuoto]
  (cond
    ;; University foundations (Aalto, Tampere etc.) — checked before general S1311* rule
    (and (= sektori "S13119") (= oikmuoto "49"))
    "yliopisto"

    ;; Central government (valtio)
    (str/starts-with? (str sektori) "S1311")
    "valtio"

    ;; Local government (kunta/kuntayhtymä)
    (or (str/starts-with? (str sektori) "S1312")
        (str/starts-with? (str sektori) "S1313"))
    "kunta_kirkko"

    ;; Non-financial corporations
    (str/starts-with? (str sektori) "S11")
    "liiketalous"

    ;; Financial corporations
    (str/starts-with? (str sektori) "S12")
    "liiketalous"

    ;; Non-profit institutions
    (str/starts-with? (str sektori) "S15")
    "voittoa_tavoittelematon"

    ;; Foundations
    (= oikmuoto "30")
    "voittoa_tavoittelematon"

    ;; Cooperatives
    (= oikmuoto "25")
    "voittoa_tavoittelematon"

    :else nil))

(defn hae-omistajatyyppi
  "Look up omistajatyyppi for a Y-tunnus from Tilastokeskus.
   Returns a string like \"kunta_kirkko\" or nil if not resolvable."
  [ytunnus]
  (when-let [data (hae-yritystiedot ytunnus)]
    (sektori->omistajatyyppi (:sektori data) (:oikmuoto data))))
