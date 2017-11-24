(ns oph.va.virkailija.ftp-service
  (:require [clj-ssh.ssh :as ssh]
            [ring.util.http-response :refer :all]
            [oph.va.hakija.api :as hakija-api];
            [oph.va.virkailija.invoice :as invoice]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.payments-data :as payments-data]))


(defn send-sftp [file ftp-config]
  (let [agent (ssh/ssh-agent {:use-system-ssh-agent false})
        session (ssh/session agent (ftp-config :host-ip) { :username (ftp-config :username) :password (ftp-config :password) :port (ftp-config :port) :strict-host-key-checking :no})]
        (ssh/with-connection session
          (let [channel (ssh/ssh-sftp session)]
            (ssh/with-channel-connection channel
              (ssh/sftp channel {} :put file (ftp-config :remote_path)))))))


(defn send-to-rondo [payment-id]
  (let [payment (payments-data/get-payment payment-id)
        ftp-config (:ftp config)
        file (str (ftp-config :local_path) "maksatus" "-" "avustushaku" "-" (payment :grant_id) "-" (System/currentTimeMillis) ".xml")
        application (payment :application_id)]
  (invoice/write-xml! (invoice/payment-to-xml payment application) file)
  (send-sftp file ftp-config)))
