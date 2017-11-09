(ns oph.va.virkailija.ftp_service
  (:require [clj-ssh.ssh :as ssh]
            [oph.va.hakija.api :as hakija-api];
            [oph.va.virkailija.invoice :as invoice]
            [oph.soresu.common.config :refer [config]]))


;(def haku (first (hakija-api/get-avustushaku-payments 2)))
;(def payment (dissoc haku :grant-content))

(def ftp-config (:ftp config))

(defn send-sftp [file]
  (let [agent (ssh/ssh-agent {:use-system-ssh-agent false})
        session (ssh/session agent (ftp-config :host-ip) { :username (ftp-config :username) :password (ftp-config :password) :port (ftp-config :port) :strict-host-key-checking :no})]
        (ssh/with-connection session
          (let [channel (ssh/ssh-sftp session)]
            (ssh/with-channel-connection channel
              (ssh/sftp channel {} :put file (ftp-config :remote_path)))))))


(defn send-to-rondo [payment application]
  (let [file (str (ftp-config :local_path) "maksatus" "-" (payment :grant-id) "-" (payment :created-at) ".xml")]
  (invoice/write-xml! (invoice/payment-to-xml payment application) file)
  (send-sftp file)))
