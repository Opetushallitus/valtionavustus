(ns oph.va.virkailija.rondo-service-spec
  (:require [speclj.core
             :refer [describe it should tags]]
             [oph.common.testing.spec-plumbing :refer [with-test-server!]]
             [oph.va.virkailija.server :refer [start-server]]
             [oph.va.virkailija.grant-data :as grant-data]
             [oph.va.virkailija.application-data :as application-data]
             [oph.va.virkailija.payments-data :as payments-data]
             [oph.va.virkailija.common-utils
              :refer [test-server-port create-submission create-application]]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.rondo-service :refer [rondo-service]]
            [oph.va.virkailija.remote-file-service :refer [RemoteFileService]]))

(def configuration {:enabled? true
                   :local-path "/tmp"
                   :remote_path "/to_rondo"
                   :remote_path_from "/from_rondo"})

(def test-data {:put nil
                :get nil
                :rm nil
                :cdls (lazy-seq ["first_file.xml" "second_file.xml"])})

(def user {:person-oid "12345"
           :first-name "Test"
           :surname "User"})

(defn do-test-sftp [& {:keys [file method path config]}]
  (= method :put) (:put test-data)
  (= method :get) (:get test-data)
  (= method :rm ) (:rm test-data)
  (= method :cdls) (:cdls test-data))

(defrecord TestFileService [configuration]
  RemoteFileService
  (send-payment-to-rondo! [service payment-values] (rondo-service/send-payment! (assoc payment-values :config (:configuration service) :func do-test-sftp)))
  (get-remote-file-list [service]
                        (let [result (do-test-sftp :method :cdls
                        :path (:remote_path_from (:configuration service))
                        :config (:configuration service))]
   (map #(last (strc/split % #"\s+")) (map str result))))
  (get-local-path [service] (get (:configuration service) :local-path (System/getProperty "java.io.tmpdir")))
  (get-remote-file [service filename]
                   (let [xml-file-path (format "%s/%s" (rondo-service/get-local-file-path (:configuration service)) filename)]
                      (do-test-sftp :method :get
                                :file xml-file-path
                                :path (:remote_path_from (:configuration service))
                                :config (:configuration service))))
  (get-local-file [service filename]
                  (format "%s/%s" (rondo-service/get-local-file-path (:configuration service)) filename))
  (delete-remote-file [service filename]
                      (do-test-sftp :method :rm
                            :file filename
                            :path (:remote_path_from (:configuration service))
                            :config (:configuration service))))

(defn create-service [config]
  (TestFileService. config))

(describe "Testing Rondo Service functions"
  (tags :rondoservice)
          (it "gets list of files in mock server"
              (let [test-service (create-service configuration)
                    result (get-remote-file-list test-service)])))
(run-specs)
