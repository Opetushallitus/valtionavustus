(ns oph.va.virkailija.rondo-service
  (:require [clj-ssh.ssh :as ssh]
            [ring.util.http-response :refer :all]
            [oph.va.hakija.api :as hakija-api];
            [oph.va.virkailija.invoice :as invoice]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.soresu.common.config :refer [config]]
            [clojure.tools.logging :as log]
            [clojure.string :as strc]))


(defn create-session! [& {:keys [file method]}]
  (let [sftp-config (:rondo-sftp config)
        agent (ssh/ssh-agent {:use-system-ssh-agent false})
      session (ssh/session agent (:host-ip sftp-config)
                           {:username (:username sftp-config)
                            :password (:password sftp-config)
                            :port (:port sftp-config)
                            :strict-host-key-checking :no})
        remote (:remote_path sftp-config)]
  (ssh/with-connection session
    (let [channel (ssh/ssh-sftp session)]
      (ssh/with-channel-connection channel
        (cond
          (= method :put) (ssh/sftp channel {} method file remote)
          (= method :get) (ssh/sftp channel {} method (format "%s/%s" remote (.getName (clojure.java.io/file file))) file)
          (= method :rm )(ssh/sftp channel {} method (format "%s/%s" remote file))
          (= method :cdls)(ssh/with-channel-connection channel (ssh/sftp channel {} :cd remote) (ssh/ssh-sftp-cmd channel :ls ["*.xml"] :with-monitor))))))))

(defn send-to-rondo! [{:keys [payment application grant filename]}]
  (let [sftp-config (:rondo-sftp config)
        file (format "%s/%s" (:local-path sftp-config) filename)]
    (invoice/write-xml! (invoice/payment-to-xml payment application grant) file)
    (if (:enabled? sftp-config)
      (let [result (create-session! :method :put :file file)]
        (if (nil? result)
          {:success true}
          {:success false :value result}))
      (do
        (log/info (format "Would send %s to %s" file (:host-ip sftp-config)))
        {:success true}))))

(defn get-file-list [result]
        (map #(last (strc/split % #"\s+")) (map str result)))

(defn handle-one-xml [filename tmp-path]
  (let [xml-file-path (format "%s/%s" tmp-path filename)]
    (create-session! :method :get :file xml-file-path)
    (payments-data/update-state-by-response (invoice/read-xml xml-file-path))
    (create-session! :method :rm :file filename)
    (clojure.java.io/delete-file xml-file-path)))


(defn get-state-from-rondo []
(let [result (create-session! :method :cdls)
      file-list (get-file-list result)
      tmp-path (System/getProperty"java.io.tmpdir")]
  (map #(handle-one-xml % tmp-path) file-list)))
