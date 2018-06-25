(ns [oph.va.virkailija.healthcheck]
  (:require [oph.va.virkailija.remote-file-service
             :refer [get-remote-file-list]]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.utils
             :refer [with-timeout]]))

(defonce ^:private status (atom []))

(defn get-last-status []
  @status)

(defn check-rondo-status []
  (let [rondo-service (rondo-service/create-service
                        (get-in config [:server :rondo-sftp]))
        result (with-timeout
            #(try
               (get-remote-file-list rondo-service)
               {:success true :error ""}
               (catch Exception e
                 {:success false :error (.getMessage e)}))
            (get-in config [:server :healthcheck-timeout] 5000)
            {:success false :error "Timeout"})]))

(defn update-status! []
  (reset! status
          (apply vector (check-rondo-status))))
