(ns oph.va.virkailija.rondo-service-spec
  (:require [speclj.core
             :refer [should should-not should= describe
                     it tags around-all run-specs should-throw should-not-throw]]
            [oph.common.testing.spec-plumbing :refer [with-test-server!]]
            [oph.va.virkailija.common-utils
             :refer [test-server-port create-submission create-application]]
            [oph.va.virkailija.server :refer [start-server]]
            [oph.va.virkailija.remote-file-service :refer [RemoteFileService]]
            [oph.va.virkailija.remote-file-service :refer :all]
            [oph.va.virkailija.rondo-service :as rondo-service]
            [oph.va.virkailija.grant-data :as grant-data]
            [oph.va.virkailija.application-data :as application-data]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.payment-batches-data :as payment-batches-data]
            [oph.va.virkailija.rondo-scheduling :as rondo-scheduling]
            [clojure.string :as strc]
            [clojure.data.xml :as xml]
            [oph.va.virkailija.invoice :as invoice]
            [clojure.tools.logging :as log]
            [clj-time.format :as f]
            [clj-time.core :as t]))


(def configuration {:enabled? true
                    :local-path "/tmp"
                    :remote_path "/to_rondo"
                    :remote_path_from "/tmp"})

(def invoice-date (java.time.LocalDate/of 2018 5 2))

(def resp-tags
  [:VA-invoice
   [:Header
    [:Pitkaviite "123/456/78"]
    [:Maksupvm invoice-date]]])

(def user {:person-oid "12345"
           :first-name "Test"
           :surname "User"})

(def test-data {:put nil
                :get nil
                :rm nil
                :cdls (lazy-seq ["file.xml"])})

(defn do-test-sftp [& {:keys [file method path config]}]
  (= method :put) nil
  (= method :get) nil
  (= method :rm ) nil
  (= method :cdls) (lazy-seq ["file.xml"]))

(defrecord TestFileService [configuration]
  RemoteFileService
  (send-payment-to-rondo! [service payment-values] (rondo-service/send-payment! (assoc payment-values :config (:configuration service) :func do-test-sftp)))
  (get-remote-file-list [service]
    (let [result (do-test-sftp :method :cdls
                               :path (:remote_path_from (:configuration service))
                               :config (:configuration service))]
      (map #(last (strc/split % #"\s+")) (map str result))))
  (get-local-path [service] (:local-path (:configuration service)))
  (get-remote-file [service filename]
    (let [xml-file-path (format "%s/%s" (rondo-service/get-local-file-path (:configuration service)) filename)]
      (if (= filename "wrong.xml")
        (with-open [w (clojure.java.io/writer  xml-file-path :append true)]
          (.write w (str "<VA-invoice>><Header><Pitkaviite>123/456/78<Pitkaviite//><Maksupvm>2018-05-02</Maksupvm></Header></VA-invoice>")))
        (invoice/write-xml! (xml/sexp-as-element resp-tags) xml-file-path))))
  (get-local-file [service filename]
    (format "%s/%s" (rondo-service/get-local-file-path (:configuration service)) filename))
  (delete-remote-file [service filename]
    (do-test-sftp :method :rm
                  :file filename
                  :path (:remote_path_from (:configuration service))
                  :config (:configuration service))))

(defn create-test-service [conf]
  (TestFileService. conf))

(describe "Testing Rondo Service functions"
          (tags :rondoservice)

          (around-all [_] (with-test-server! :virkailija-db
                            #(start-server
                              {:host "localhost"
                               :port test-server-port
                               :auto-reload? false}) (_)))

          (it "gets list of files in mock server"
              (let [test-service (create-test-service configuration)
                    result (get-remote-file-list test-service)]
                (should= result (:cdls test-data))))

          (it "gets local path in mock server"
              (let [test-service (create-test-service configuration)]
                (should= (get-local-path test-service) (:local-path configuration))))

          (it "Gets state of payments from a remote server"
              (let [test-service (create-test-service configuration)
                    grant (first (grant-data/get-grants))
                    submission (create-submission (:form grant) {})
                    application (create-application grant submission)
                    batch (payment-batches-data/create-batch
                           {:receipt-date invoice-date
                            :due-date invoice-date
                            :partner ""
                            :grant-id (:id grant)
                            :document-id ""
                            :currency "EUR"
                            :invoice-date invoice-date
                            :document-type "XA"
                            :transaction-account "6000"
                            :acceptor-email "acceptor@local"
                            :inspector-email "inspector@local"})
                    payment (payments-data/create-payment
                             {:application-id (:id application)
                              :payment-sum 26000
                              :batch-id (:id batch)
                              :phase 0
                              :state 2
                              :invoice-date invoice-date}
                             user)
                    result  (rondo-scheduling/get-state-of-payments test-service)]
                (should= 3  (:state (payments-data/get-payment (:id payment))))))

          (it "If problems with retrieving state from rondo, show errors correctly"

              (let [configuration {:enabled true
                                   :local-path "/tmp"}
                    test-service (create-test-service configuration)
                    grant (first (grant-data/get-grants))
                    result (payments-data/delete-grant-payments (:id grant))
                    application (application-data/find-application-by-register-number "123/456/78")
                    batch (payment-batches-data/create-batch
                           {:receipt-date invoice-date
                            :due-date invoice-date
                            :partner ""
                            :grant-id (:id grant)
                            :document-id ""
                            :currency "EUR"
                            :invoice-date invoice-date
                            :document-type "XA"
                            :transaction-account "6000"
                            :acceptor-email "acceptor@local"
                            :inspector-email "inspector@local"})
                    payment (payments-data/create-payment
                             {:application-id (:id application)
                              :payment-sum 26000
                              :batch-id (:id batch)
                              :state 3
                              :phase 0
                              :invoice-date invoice-date}
                             user)]
                (should-throw Exception #"Payment already paid" (rondo-scheduling/get-state-of-payments test-service))))

          (it "When retrieving payment xml from Rondo, show errors if there are no corresponding payments"

              (let [configuration {:enabled true
                                   :local-path "/tmp"}
                    test-service (create-test-service configuration)
                    grant (first (grant-data/get-grants))
                    result (payments-data/delete-grant-payments (:id grant))
                    application (application-data/find-application-by-register-number "123/456/78")]
                (should-throw Exception #"No payments found!" (rondo-scheduling/get-state-of-payments test-service))))

          (it "When retrieving payment xml from Rondo, show parse errors, if xml is not valid"
              (let [test-service (create-test-service configuration)
                    list-of-files (lazy-seq ["wrong.xml"])]
                (should-throw Exception #"ParseError" (rondo-scheduling/fetch-xml-files list-of-files test-service))
                (clojure.java.io/delete-file (get-local-file test-service "wrong.xml")))))
(run-specs)
