(ns oph.va.virkailija.rondo-service-spec
  (:require [speclj.core
             :refer [should should-not should= describe
                     it tags around-all run-specs should-throw before]]
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
            [clojure.tools.logging :as log]))


(def configuration {:enabled? true
                    :local-path "/tmp"
                    :remote_path "/to_rondo"
                    :remote_path_from "/tmp"})

(def invoice-date (java.time.LocalDate/of 2018 5 2))

(def resp-tags
  [:VA-invoice
   [:Header
    [:Pitkaviite "123/456/78_1"]
    [:Maksupvm invoice-date]]])

(def user {:person-oid "12345"
           :first-name "Test"
           :surname "User"})

(defn invocation-recorder [items]
  (fn [item] (swap! items (fn [i] (conj i item)))))

(def deleted-remote-files (atom nil))
(def reported-exceptions (atom nil))
(def mark-remote-file-as-deleted (invocation-recorder deleted-remote-files))
(def report-an-exception (invocation-recorder reported-exceptions))

(defrecord TestFileService [configuration delete-file-cb report-exception-cb]
  RemoteFileService
  (send-payment-to-rondo! [service payment-values] (rondo-service/send-payment! (assoc payment-values :config (:configuration service) :func (constantly nil))))
  (get-remote-file-list [service]
    (list "file.xml"))
  (get-local-path [service] (:local-path (:configuration service)))
  (get-remote-file [service filename]
    (let [xml-file-path (format "%s/%s" (rondo-service/get-local-file-path (:configuration service)) filename)]
      (invoice/write-xml! (xml/sexp-as-element resp-tags) xml-file-path)))
  (get-local-file [service filename]
    (format "%s/%s" (rondo-service/get-local-file-path (:configuration service)) filename))
  (delete-remote-file! [service filename]
    (delete-file-cb filename)
    nil)
  (report-exception [service msg exception] (report-exception-cb exception)))

(defn create-test-service [conf]
  (TestFileService. conf mark-remote-file-as-deleted report-an-exception))

(defrecord WrongTestFileService [configuration delete-file-cb report-exception-cb]
  RemoteFileService
  (send-payment-to-rondo! [service payment-values] (rondo-service/send-payment! (assoc payment-values :config (:configuration service) :func (constantly nil))))
  (get-remote-file-list [service]
    (list "wrong.xml"))
  (get-local-path [service] (:local-path (:configuration service)))
  (get-remote-file [service filename]
    (let [xml-file-path (format "%s/%s" (rondo-service/get-local-file-path (:configuration service)) filename)]
      (if (= filename "wrong.xml")
        (with-open [w (clojure.java.io/writer  xml-file-path :append true)]
          (.write w "<VA-invoice>><Header><Pitkaviite>123/456/78_1<Pitkaviite//><Maksupvm>2018-05-02</Maksupvm></Header></VA-invoice>"))
        (invoice/write-xml! (xml/sexp-as-element resp-tags) xml-file-path))))
  (get-local-file [service filename]
    (format "%s/%s" (rondo-service/get-local-file-path (:configuration service)) filename))
  (delete-remote-file! [service filename]
    (delete-file-cb filename)
    nil)
  (report-exception [service msg exception] (report-exception-cb exception)))


(defn create-wrong-test-service [conf]
  (WrongTestFileService. conf mark-remote-file-as-deleted report-an-exception))

(describe "Testing Rondo Service functions"
          (tags :rondoservice)

          (around-all [_] (with-test-server! "virkailija"
                            #(start-server
                              {:host "localhost"
                               :port test-server-port
                               :auto-reload? false}) (_)))

          (before
            (reset! deleted-remote-files nil)
            (reset! reported-exceptions nil))

          (it "Gets paymentstatus of payments from a remote server"
              (let [test-service (create-test-service configuration)
                    grant (first (grant-data/get-grants))
                    submission (create-submission (:form grant) {})
                    application (create-application grant submission)
                    batch (payment-batches-data/create-batch
                           {:receipt-date invoice-date
                            :due-date invoice-date
                            :partner ""
                            :grant-id (:id grant)
                            :currency "EUR"
                            :invoice-date invoice-date
                            :document-type "XE"
                            :transaction-account "6000"})
                    payment (payments-data/create-payment
                             {:application-id (:id application)
                              :payment-sum 26000
                              :batch-id (:id batch)
                              :phase 0
                              :paymentstatus-id "sent"
                              :invoice-date invoice-date}
                             user)
                    result  (rondo-scheduling/get-statuses-of-payments test-service)]
                (should= "paid" (:paymentstatus-id (payments-data/get-payment (:id payment))))))

          (it "If payment is already paid ignore exception and delete remote file"
              (let [configuration {:enabled true
                                   :local-path "/tmp"}
                    test-service (create-test-service configuration)
                    grant (first (grant-data/get-grants))
                    result (payments-data/delete-all-grant-payments (:id grant))
                    application (application-data/find-application-by-register-number "123/456/78")
                    batch (payment-batches-data/create-batch
                           {:receipt-date invoice-date
                            :due-date invoice-date
                            :partner ""
                            :grant-id (:id grant)
                            :currency "EUR"
                            :invoice-date invoice-date
                            :document-type "XE"
                            :transaction-account "6000"})
                    payment (payments-data/create-payment
                             {:application-id (:id application)
                              :payment-sum 26000
                              :batch-id (:id batch)
                              :paymentstatus-id "paid"
                              :phase 0
                              :invoice-date invoice-date}
                             user)]
                (should=
                  nil (rondo-scheduling/get-statuses-of-payments test-service)))
                (should= '("file.xml") @deleted-remote-files)
                (should= nil @reported-exceptions))

          (it "If no payment is found, ignore exception but don't delete remote file"
              (let [configuration {:enabled true
                                   :local-path "/tmp"}
                    test-service (create-test-service configuration)
                    grant (first (grant-data/get-grants))]
                (payments-data/delete-all-grant-payments (:id grant))
                (should= nil (rondo-scheduling/get-statuses-of-payments test-service)))
                (should= nil @deleted-remote-files)
                (should= nil @reported-exceptions))

          (it "If xml is malformed, report exception and don't delete remote file"
              (let [test-service (create-wrong-test-service configuration)]
                (should= nil (rondo-scheduling/get-statuses-of-payments test-service)))
                (should= nil @deleted-remote-files)
                (should= 1 (count @reported-exceptions))))

(run-specs)
