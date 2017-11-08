(ns oph.va.virkailija.ftp_service
  (:require [clj-ssh.ssh :refer all]
            [oph.va.hakija.api :as hakija-api];
            [oph.va.virkailija.invoice :as invoice]
            [oph.soresu.common.config :refer [config]]))


(def haku (first (hakija-api/get-avustushaku-payments 2)))
(def payment (dissoc haku :grant-content))
(def ftp-config (:ftp config))

(defn send-to-ftp [payment]
  (let [agent (ssh-agent {})
        payment_file_name (str (payment :grant-id) "-" (payment :created-at) ".xml")
        payment_xml   (invoice/write-xml! (invoice/tags-to-str payment) (str (ftp-config :local_path) "/" payment_file_name))]
    (let [session (session agent (ftp-config :host-ip) {:strict-host-key-checking :no})]
      (with-connection session
        (let [channel (ssh-sftp session)]
          (with-channel-connection channel
            (sftp channel {} :cd (ftp-config :remote_path))
            (sftp channel {} :put (ftp-config :local_path) payment_file_name)))))))
