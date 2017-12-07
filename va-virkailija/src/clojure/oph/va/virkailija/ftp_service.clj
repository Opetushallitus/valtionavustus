(ns oph.va.virkailija.ftp-service
  (:require [clj-ssh.ssh :as ssh]
            [ring.util.http-response :refer :all]
            [oph.va.hakija.api :as hakija-api];
            [oph.va.virkailija.invoice :as invoice]
            [oph.soresu.common.config :refer [config]]
            [oph.va.virkailija.payments-data :as payments-data]
            [clojure.tools.logging :as log]))

(defn send-sftp! [file sftp-config]
  (let [agent (ssh/ssh-agent {:use-system-ssh-agent false})
        session (ssh/session agent (:host-ip sftp-config)
                             {:username (:username sftp-config)
                              :password (:password sftp-config)
                              :port (:port sftp-config)
                              :strict-host-key-checking :no})]
    (ssh/with-connection session
      (let [channel (ssh/ssh-sftp session)]
        (ssh/with-channel-connection channel
          (ssh/sftp channel {} :put file (:remote_path sftp-config)))))))

(defn send-to-rondo! [payment-id]
  (let [payment (payments-data/get-payment payment-id)
        sftp-config (:rondo-sftp config)
        file (format "%s/payment-%d-%d.xml"
                     (:local-path sftp-config) (:id payment)
                     (System/currentTimeMillis))
        application (:application-id payment)]
    (invoice/write-xml! (invoice/payment-to-xml payment application) file)
    (if (:enabled? sftp-config)
      (send-sftp! file sftp-config)
      (log/info (format "Would send %s to %s" file (:host-ip sftp-config))))))
