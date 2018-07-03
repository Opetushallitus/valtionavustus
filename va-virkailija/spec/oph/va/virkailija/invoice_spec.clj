(ns oph.va.virkailija.invoice-spec
  (:require [speclj.core
             :refer [describe it should= should-throw
                     tags around-all run-specs]]
            [oph.common.testing.spec-plumbing :refer [with-test-server!]]
            [oph.va.virkailija.server :refer [start-server]]
            [oph.va.virkailija.common-utils
            :refer [test-server-port create-submission
                    create-application admin-authentication
                    valid-payment-values delete! add-mock-authentication
                    create-application-evaluation
                    create-application-evaluation]]
            [oph.va.virkailija.application-data :as application-data]
            [oph.va.virkailija.payment-batches-data :as payment-batches-data]
            [oph.va.virkailija.grant-data :as grant-data]
            [clj-time.format :as f]
            [clojure.data.xml :as xml]
            [oph.va.virkailija.invoice :as invoice]
            [oph.va.virkailija.payments-data :as payments-data]
            [oph.va.virkailija.va-code-values-data :as va-code-values]
            [oph.va.hakija.api :as hakija-api]
            [oph.va.routes :as va-routes]
            [clojure.data.xml :refer [parse]]))

(def payment {:acceptor-email "acceptor@example.com"
              :created-at (f/parse "2017-12-20T10:24:59.750Z")
              :application-id 6114
              :currency "EUR"
              :document-type "XA"
              :due-date (f/parse "2017-12-20T10:24:59.750Z")
              :inspector-email "inspector@example.com"
              :invoice-date (f/parse "2017-12-20T10:24:59.750Z")
              :organisation "6600"
              :receipt-date (f/parse "2017-12-20T10:24:59.750Z")
              :state 0
              :transaction-account "5000"
              :partner ""
              :batch-number 13})

(def application {:project-name "Example project"
                  :register-number "1/234/2017"
                  :organization-name "Some organisation"
                  :grant-id 87
                  :budget-total 14445
                  :language "fi"
                  :id 6114
                  :budget-oph-share 13000
                  :version 432
                  :created-at (f/parse "2017-05-19T10:21:23.138168000-00:00")})

(def answers '({:key "key1" :value "somevalue" :fieldType "textArea"}
               {:key "email" :value "test@user.com" :fieldType "emailField"}))

(def response-tags [:VA-invoice
                    [:Header
                     [:Pitkaviite "1/234/2018"]
                     [:Maksupvm "2018-01-25"]]])

(def response-xml (xml/sexp-as-element response-tags))

(describe
  "Get answer value"
  (tags :invoice)

  (it "gets answer value"
      (should= "test@user.com"
               (invoice/get-answer-value answers "email")))
  (it "returns nil if key not found"
      (should= nil (invoice/get-answer-value answers "non-existing")))
  (it "returns default if key not found"
      (should= "default"
               (invoice/get-answer-value
                 answers "non-existing" "default")))
  (it "returns value if found altough default was given"
      (should= "somevalue"
               (invoice/get-answer-value answers "key1" "default"))))

(describe
  "Response XML values"
  (tags :invoice :payment-response)

  (it "get values"
      (should=
        {:register-number "1/234/2018"
         :invoice-date "2018-06-08"}
        (invoice/read-response-xml
          (parse
            (java.io.ByteArrayInputStream.
              (.getBytes
                "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>
                 <VA-invoice>
                   <Header>
                     <Pitkaviite>1/234/2018</Pitkaviite>
                     <Maksupvm>2018-06-08</Maksupvm>
                   </Header>
                 </VA-invoice>")))))))

(describe
  "Get batch number of payment"
  (tags :invoice)

  (it "calculates batch id"
      (should= "660017013"
               (invoice/get-batch-key
                 payment {:content {:document-type "XA"}})))
  (it "returns nil if any needed value is nil"
      (should= nil (invoice/get-batch-key nil {}))
      (should= nil (invoice/get-batch-key {:some "Value"} {}))))

(describe
  "Get response XML element content"
  (tags :invoice)

  (it "gets content of Pitkaviite"
      (should=
        '("1/234/2018")
        (invoice/get-content response-xml
                             [:VA-invoice :Header :Pitkaviite])))
  (it "gets content of Maksupvm"
      (should=
        '("2018-01-25")
        (invoice/get-content response-xml
                             [:VA-invoice :Header :Maksupvm]))))

(describe
  "Handle response XML get value errors"
  (tags :invoice)

  (it "returns nil if last not found"
      (should=
        nil
        (invoice/get-content response-xml
                             [:VA-invoice :Header :Not-Found])))
  (it "returns nil if first tag not found"
      (should=
        nil
        (invoice/get-content response-xml
                             [:Not-Found :Header :Pitkaviite])))
  (it "returns nil if xml is nil"
      (should= nil (invoice/get-content nil [:Not-Valid :Child])))
  (it "returns root content if keys are empty"
      (should=
        :VA-invoice
        (:tag (first (invoice/get-content response-xml [])))))
  (it "returns root content if keys are nil"
      (should=
        :VA-invoice
        (:tag (first (invoice/get-content response-xml nil))))))

(describe
  "Invoice generate"

  (tags :invoice :invoicegenerate)

  (around-all [_] (with-test-server! :virkailija-db
                    #(start-server
                       {:host "localhost"
                        :port test-server-port
                        :auto-reload? false
                        :without-authentication? true}) (_)))

  (it "creates invoice from payment"
      (let [grant (first (grant-data/get-grants true))
            submission
            (create-submission
              (:form grant)
              {:value
               [{:key "business-id" :value "1234567-1" :fieldType "textArea"}
                {:key "bank-iban" :value "FI4250001510000023" :fieldType "textArea"}
                {:key "bank-bic" :value "OKOYFIHH" :fieldType "textArea"}
                {:key "bank-country" :value "FI" :fieldType "textArea"}
                {:key "address" :value "Someroad 1" :fieldType "textArea"}
                {:key "city" :value "Some City" :fieldType "textArea"}
                {:key "country" :value "Some Country" :fieldType "textArea"}
                {:key "ownership-type" :value "liiketalous" :fieldType "textArea"}]})
            application (create-application grant submission)
            batch (assoc
                    (payment-batches-data/create-batch
                      {:receipt-date (java.time.LocalDate/of 2017 12 20)
                       :due-date (java.time.LocalDate/of 2017 12 27)
                       :partner "None"
                       :grant-id (:id grant)
                       :currency "EUR"
                       :invoice-date (java.time.LocalDate/of 2017 12 20)})
                    :created-at (f/parse "2017-12-20T10:24:59.750Z"))
            payment (payments-data/create-payment
                      {:application-id (:id application)
                       :payment-sum 20000
                       :batch-id (:id batch)
                       :state 1
                       :phase 0}
                      {:person-oid "12345"
                       :first-name "Test"
                       :surname "User"})]
        (payment-batches-data/create-batch-document
          (:id batch)
          {:acceptor-email "acceptor@example.com"
           :presenter-email "presenter@example.com"
           :phase 0
           :document-id "ID12345"})
        (create-application-evaluation application "accepted")
        (let [application-with-evaluation
              (some
                #(when (= (:id %) (:id application)) %)
                (grant-data/get-grant-applications-with-evaluation
                  (:id grant)))]

          (should=
            [:VA-invoice
             [:Header
              [:Maksuera (format "6600170%02d" (:batch-number batch))]
              [:Laskunpaiva "2017-12-20"]
              [:Erapvm "2017-12-27"]
              [:Bruttosumma 20000]
              [:Maksuehto "Z001"]
              [:Pitkaviite "123/456/78"]
              [:Tositepvm "2017-12-20"]
              [:Asiatarkastaja "presenter@example.com"]
              [:Hyvaksyja "acceptor@example.com"]
              [:Tositelaji "XA"]
              [:Maksutili "5000"]
              [:Toimittaja
               [:Y-tunnus "1234567-1"]
               [:Nimi "Test Organisation"]
               [:Postiosoite "Someroad 1"]
               [:Paikkakunta "Some City"]
               [:Maa "Some Country"]
               [:Iban-tili "FI4250001510000023"]
               [:Pankkiavain "OKOYFIHH"]
               [:Pankki-maa "FI"]
               [:Kieli "fi"]
               [:Valuutta "EUR"]]
              [:Postings
               [:Posting
                [:Summa 20000]
                [:LKP-tili "82300000"]
                [:TaKp-tili "29103013"]
                [:Toimintayksikko "6600100130"]
                [:Projekti "6600A-M2024"]
                [:Toiminto "6600151502"]
                [:Kumppani "None"]]]]]
            (invoice/payment-to-invoice
              {:payment payment
               :application application-with-evaluation
               :grant (-> grant
                          (assoc
                            :project "6600A-M2024"
                            :operational-unit "6600100130"
                            :operation "6600151502"
                            :lkp-account "82500000")
                          (assoc-in [:content :document-type] "XA")
                          (assoc-in [:content :transaction-account] "5000"))
               :batch (assoc batch :documents
                             (payment-batches-data/get-batch-documents
                               (:id batch)))}))))))

(run-specs)
