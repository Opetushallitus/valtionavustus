(ns oph.va.virkailija.rondo-service
  (:require [clj-ssh.ssh :as ssh]
            [oph.va.virkailija.remote-file-service :refer [RemoteFileService get-local-file get-sent-maksatukset-file-list]]
            [oph.va.virkailija.invoice :as invoice]
            [clojure.tools.logging :as log]
            [clojure.string :as strc]
            [oph.va.virkailija.payments-data :as payments-data]))


(defn create-session
  [config]
  (let [agent (ssh/ssh-agent {:use-system-ssh-agent false})]
    (ssh/session agent (:host-ip config)
                 {:username (:username config)
                  :password (:password config)
                  :port (:port config)
                  :strict-host-key-checking (:strict-host-key-checking config)})))

(defn put-maksupalaute-to-maksatuspalvelu [file config]
    (let [session (create-session config)
          remote (:remote_path_from config)]
      (ssh/with-connection session
        (let [channel (ssh/ssh-sftp session)]
          (ssh/with-channel-connection channel
             (ssh/sftp channel {} :put file remote)))))
)

(defn do-sftp! [& {:keys [file method path config]}]
  (let [session (create-session config)
        remote (:remote_path config)]
    (ssh/with-connection session
      (let [channel (ssh/ssh-sftp session)]
        (ssh/with-channel-connection channel
          (cond
            (= method :put) (ssh/sftp channel {} method file remote)
            (= method :get)
            (ssh/sftp channel {} method
                      (format "%s/%s" path (.getName (clojure.java.io/file file)))
                      file)
            (= method :rm )(ssh/sftp channel {} method (format "%s/%s" path file))
            (= method :cdls)
            (ssh/with-channel-connection channel
              (ssh/sftp channel {} :cd path)
              (ssh/ssh-sftp-cmd channel :ls ["*.xml"] :with-monitor))))))))

(defn get-local-file-path [config]
  (get-in config [:local-path] (System/getProperty "java.io.tmpdir")))

(defn send-payment! [{:keys [payment application grant filename batch config func]}]
  (let [file (format "%s/%s" (get-local-file-path config) filename)
        invoice-element (invoice/payment-to-xml {:payment payment :application application :grant grant :batch batch})
        invoice-xml (invoice/write-xml! invoice-element file)]

    (payments-data/store-outgoing-payment-xml payment invoice-xml)
    (if (:enabled? config)
      (let [result
            (func :method :put :file file :path (:remote_path config)
                  :config config)]
        (if (nil? result)
          {:success true}
          {:success false :value result}))
      (do
        (log/info (format "Would send %s to %s" file (:host-ip config)))
        {:success true}))))

(defrecord RondoFileService [configuration]
  RemoteFileService
  (send-payment-to-rondo! [service payment-values] (send-payment! (assoc payment-values :config (:configuration service) :func do-sftp!)))

  (get-all-maksatukset-from-maksatuspalvelu [service]
    (let [list-of-files (get-sent-maksatukset-file-list service)]
      (for [filename list-of-files]
        (let [xml-file-path (format "%s/%s" (get-local-file-path (:configuration service)) filename)]
          (do-sftp! :method :get
                    :file xml-file-path
                    :path (:remote_path (:configuration service))
                    :config (:configuration service))

          (slurp (get-local-file service filename)))
        )))
  (get-remote-file-list [service]
    (let [result (do-sftp! :method :cdls
                           :path (:remote_path_from (:configuration service))
                           :config (:configuration service))]
      (map #(last (strc/split (str %) #"\s")) result)))
  (get-sent-maksatukset-file-list [service]
    (let [result (do-sftp! :method :cdls
                           :path (:remote_path (:configuration service))
                           :config (:configuration service))]
      (map #(last (strc/split (str %) #"\s")) result)))
  (get-local-path [service] (get-in (:configuration service) [:local-path] (System/getProperty "java.io.tmpdir")))
  (get-remote-file [service filename]
    (let [xml-file-path (format "%s/%s" (get-local-file-path (:configuration service))  filename)]
      (do-sftp! :method :get
                :file xml-file-path
                :path (:remote_path_from (:configuration service))
                :config (:configuration service))))
  (get-local-file [service filename]
    (format "%s/%s" (get-local-file-path (:configuration service)) filename))
  (delete-remote-file! [service filename]
    (do-sftp! :method :rm
              :file filename
              :path (:remote_path_from (:configuration service))
              :config (:configuration service)))
  (report-exception [_service msg exception] (log/error msg exception)))

(defn create-service [config]
  (RondoFileService. config))
