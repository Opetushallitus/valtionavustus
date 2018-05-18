(ns oph.va.virkailija.rondo-service-spec
  (:require [speclj.core
             :refer [describe it should tags]]
            [oph.va.virkailija.rondo-service :refer [rondo-service]]
            [oph.va.virkailija.remote-file-service :refer [RemoteFileService]]))


(defrecord TestFileService [configuration]
  RemoteFileService
  (send-payment-to-rondo! [service payment-values] (send-payment! (assoc payment-values :config (:configuration service) :func do-sftp!)))
  (get-remote-file-list [service]
                        (let [result (do-sftp! :method :cdls
                        :path (:remote_path_from (:configuration service))
                        :config (:configuration service))]
   (map #(last (strc/split % #"\s+")) (map str result))))
  (get-local-path [service] (get (:configuration service) :local-path (System/getProperty "java.io.tmpdir")))
  (get-remote-file [service filename]
                   (let [xml-file-path (format "%s/%s" (get-local-file-path (:configuration service))  filename)]
                      (do-sftp! :method :get
                                :file xml-file-path
                                :path (:remote_path_from (:configuration service))
                                :config (:configuration service))))
  (get-local-file [service filename]
                  (format "%s/%s" (get-local-file-path (:configuration service)) filename))
  (delete-remote-file [service filename]
                      (do-sftp! :method :rm
                            :file filename
                            :path (:remote_path_from (:configuration service))
                            :config (:configuration service))))

(defn create-service [config]
  (TestFileService. config))

(def conf )

(describe "Testing Rondo Service functions"
  (tags :rondoservice)
          (it "gets list of files in remote server"
              (let [result ) )
