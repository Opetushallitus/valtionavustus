(ns oph.va.virkailija.rondo-service
  (:require [clj-ssh.ssh :as ssh]
            [ring.util.http-response :refer :all]
            [oph.va.hakija.api :as hakija-api];
            [oph.va.virkailija.invoice :as invoice]
            [oph.soresu.common.config :refer [config]]
            [clojure.tools.logging :as log]
            [clojure.string :as strc]))

(defn do-sftp! [method file sftp-config]
  (let [agent (ssh/ssh-agent {:use-system-ssh-agent false})
      session (ssh/session agent (:host-ip sftp-config)
                           {:username (:username sftp-config)
                            :password (:password sftp-config)
                            :port (:port sftp-config)
                            :strict-host-key-checking :no})]
  (ssh/with-connection session
    (let [channel (ssh/ssh-sftp session)]
      (ssh/with-channel-connection channel
        (cond
          (= method "put") (ssh/sftp channel {} :put file (:remote_path sftp-config))
          (= method "get") (ssh/sftp channel {} :get (format "%s/%s" (:remote_path sftp-config) file) (format "%s/%s" (:local-path sftp-config) file))
          (= method "rm") (ssh/sftp channel {} :rm (format "%s/%s" (:remote_path sftp-config) file))))))))


(defn send-to-rondo! [{:keys [payment application grant filename]}]
  (let [sftp-config (:rondo-sftp config)
        file (format "%s/%s" (:local-path sftp-config) filename)]
    (invoice/write-xml! (invoice/payment-to-xml payment application grant) file)
    (if (:enabled? sftp-config)
      (let [result (do-sftp! "put" file sftp-config)]
        (if (nil? result)
          {:success true}
          {:success false :value result}))
      (do
        (log/info (format "Would send %s to %s" file (:host-ip sftp-config)))
        {:success true}))))

(defn get-file-list [result]
      (let [output (map #(str %) result)]
        (map #(last (strc/split % #"\s+")) output)))

(defn handle-one-xml [filename sftp-config]
  (let [ xml-file-path (format "%s/%s" (:local-path sftp-config) filename)]
    (do-sftp! "get" filename sftp-config)
    (invoice/read-response-xml (invoice/read-xml xml-file-path)))
    (do-sftp! "rm" filename sftp-config))

(defn get-files-from-rondo [config]
          (let [agent (ssh/ssh-agent {:use-system-ssh-agent false})]
             (let [sftp-config (:rondo-sftp config)
                   session (ssh/session agent (:host-ip sftp-config)
                                {:username (:username sftp-config)
                                 :password (:password sftp-config)
                                 :port (:port sftp-config)
                                 :strict-host-key-checking :no})]
               (ssh/with-connection session
                 (let [channel (ssh/ssh-sftp session)]
                   (ssh/with-channel-connection channel
                    (ssh/sftp channel {} :cd "/upload")
                     (let [result (ssh/ssh-sftp-cmd channel :ls ["*.xml"] :with-monitor)
                           file-list (get-file-list result)]
                       (map #(handle-one-xml % sftp-config) file-list))))))))
