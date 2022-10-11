(ns oph.va.virkailija.invoice
  (:require [oph.va.virkailija.lkp-templates :as lkp]
            [clojure.data.xml :refer [emit parse
                                      sexp-as-element]]
            [clj-time.core :as t]
            [clj-time.coerce :as c]
            [oph.va.virkailija.utils :refer [remove-white-spaces]]
            [clojure.string :as c-str]
            [clojure.java.io :as io]))

(def organisations {"XA" 6600
                    "XE" 6600
                    "XB" 6604})

(defn timestamp-to-date ([ts]
  (try (.format (new java.text.SimpleDateFormat "yyyy-MM-dd") ts )
  (catch Exception _ ""))
))


(defn get-answer-value
  ([answers key]
   (:value
    (first
      (filter #(= (:key %) key) answers))))
  ([answers key not-found]
   (or (get-answer-value answers key) not-found)))

(defn get-batch-key
  ([organisation year batch-number]
   (format "%s%02d%03d" organisation year batch-number))
  ([batch grant]
   "Generating batch id of organisation, year and batch-number.
  Batch id is something like '660017006' where 6600 is organisation, 17 is
  year and 006 is order number or identification number, if you will.
  If some of values is missing, nil is being returned."
   (when (and (:created-at batch)
            (some? (get-in grant [:content :document-type]))
            (:batch-number batch))
     (get-batch-key
       (get organisations (get-in grant [:content :document-type]))
       (mod (t/year (c/to-date-time (:created-at batch))) 100)
       (:batch-number batch)))))

(defn generate-implicit-pitkäviite [payment application]
  (format "%s_%s" (:register-number application) (inc (:phase payment))))

(defn get-pitkäviite [payment application]
  (if-some [pitkaviite (:pitkaviite payment)]
    pitkaviite
    (generate-implicit-pitkäviite payment application)))

(defn- get-ovt [grant]
  (if (= (get-in grant [:operational-unit :code]) "6600105300")
    "00372769790122"
    "003727697901"))

(defn payment-to-invoice [{:keys [payment application grant batch]}]
  (let [answers (:answers application)
        document (some
                   #(when (= (:phase %) (:phase payment)) %)
                   (:documents batch))]
    [:objects
     [:object
     [:header
      [:toEdiID (get-ovt grant)]
      [:invoiceType "INVOICE"]
      [:vendorName (:organization-name application)]
      [:addressFields
       [:addressField1 (get-answer-value answers "address" "")]
       [:addressField2 (get-answer-value answers "city" "")]
       [:addressField5 (get-answer-value answers "country" "")]]

      [:vendorRegistrationId (get-answer-value answers "business-id")]
      [:bic (get-answer-value answers "bank-bic")]
      [:bankAccount (get-answer-value answers "bank-iban")]
      [:invoiceNumber (format
                        "%s_%s"
                        (:register-number application) (inc (:phase payment)))]
      [:longReference (get-pitkäviite payment application)]
      [:documentDate (.toString (:invoice-date batch))]
      [:dueDate (.toString (:due-date batch))]
      [:paymentTerm "Z001"]
      [:currencyCode (:currency batch)]
      [:grossAmount (:payment-sum payment)]
      [:netamount (:payment-sum payment)]
      [:vatamount 0]
      [:voucherSeries (get-in grant [:content :document-type] "XE")]
      [:postingDate (.toString (:receipt-date batch))]
      [:ownBankShortKeyCode (get-in grant [:content :transaction-account])]

      [:handler
       [:verifierName (:presenter-email document)]
       [:verifierEmail (:presenter-email document)]
       [:approverName (:acceptor-email document)]
       [:approverEmail (:acceptor-email document)]
       [:verifyDate (timestamp-to-date (:created-at document) ) ]
       [:approvedDate (timestamp-to-date (:created-at document)) ]
       ]

      [:otsData
       [:otsBankCountryKeyCode (get-answer-value answers "bank-country" "")]
       ]

      [:invoicesource "VA"]

      ]

      [:postings
       [:postingRows
        [:postingRow
         [:rowId 1]
         [:generalLedgerAccount (lkp/get-lkp-account (:answers application))]
         [:postingAmount (:payment-sum payment)]
         [:accountingObject01
            (let [toimintayksikko (get-in grant [:operational-unit :code])]
              (if toimintayksikko (remove-white-spaces toimintayksikko) toimintayksikko))]
         [:accountingObject02 (:takp-account application)]
         [:accountingObject04 (:project-code payment)]
         [:accountingObject05 (get-in grant [:operation :code])]
         [:accountingObject08 (:partner batch)]]]]
      ]]))


(defn valid-pitkaviite? [pitkaviite]
  (and pitkaviite
       (re-seq #"^\d+\/\d+\/\d+(_\d+)?( .+)?$" pitkaviite)))

(defn strip-contact-person-name [s]
  (if (c-str/includes? s " ")
    (first (c-str/split s #" "))
    s))

(defn parse-pitkaviite
  ([pitkaviite default-phase]
  (when-not (valid-pitkaviite? pitkaviite)
    (throw (ex-info "Invalid pitkäviite" {:value pitkaviite})))
  (let [[body phase] (c-str/split (strip-contact-person-name pitkaviite) #"_")]
    {:register-number body
     :phase (if (seq phase)
              (dec (Integer/parseInt phase))
              default-phase)}))
  ([pitkaviite] (parse-pitkaviite pitkaviite 0)))

(defn payment-to-xml
  "Creates xml document (tags) of given payment of Valtionavustukset maksatus.
  Document should be valid document for VIA/Rondo."
  [data]
  (sexp-as-element (payment-to-invoice data)))

(defn get-content [xml ks]
  (loop [content (list xml) xks ks]
    (if (empty? xks)
      content
      (let [k (first xks)
            v (some (fn [e] (when (= (:tag e) k) e)) content)]
        (when-not (nil? v)
          (recur (:content v) (rest xks)))))))

(defn read-response-xml [xml]
  {:register-number (first (get-content xml [:VA-invoice :Header :Pitkaviite]))
   :invoice-date (first (get-content xml [:VA-invoice :Header :Maksupvm]))})

(defn write-xml!
  "Writes XML document to a file and returns the document as a string.
  Document should be tags as clojure.data.xml.elements."
  [tags file]
  (with-open [writer (java.io.StringWriter. )]
    (emit tags writer :encoding "UTF-8")
    (let [xml-string (.toString writer)]
      (spit file xml-string :encoding "UTF-8")
      xml-string)))

(defn read-xml-string [s]
  (with-open [input (io/input-stream (.getBytes s "UTF-8"))]
    (parse input)))
