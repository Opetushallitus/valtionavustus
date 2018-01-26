(ns oph.va.virkailija.invoice
  (:require [oph.va.virkailija.lkp-templates :as lkp]
   [clojure.data.xml :refer [emit emit-str parse
                                      sexp-as-element]]
            [clj-time.core :as t]
            [clj-time.coerce :as c]
            [clj-time.format :as f]))

(def date-formatter (f/formatter "yyyy-MM-dd"))

(defn get-answer-value
  ([answers key]
   (:value
    (first
     (filter #(= (:key %) key) answers))))
  ([answers key not-found]
   (or (get-answer-value answers key) not-found)))

(defn format-date [date]
  (if date
    (f/unparse date-formatter date)
    date))

(defn get-installment
  ([organisation year installment-number]
   (format "%s%02d%03d" organisation year installment-number))
  ([payment]
   "Generating installment of organisation, year and installment-number.
  Installment is something like '660017006' where 6600 is organisation, 17 is
  year and 006 is order number or identification number, if you will.
  If some of values is missing, nil is being returned."
   (if (and (:created-at payment)
            (:organisation payment)
            (:installment-number payment))
     (get-installment
       (:organisation payment)
       (mod (t/year (c/to-date-time (:created-at payment))) 1000)
       (:installment-number payment))
     nil)))

(defn payment-to-invoice [payment application grant]
  (let [answers (:answers application)]
    [:VA-invoice
     [:Header
      [:Maksuera (get-installment payment)]
      [:Laskunpaiva (format-date (:invoice-date payment))]
      [:Erapvm (format-date (:due-date payment))]
      [:Bruttosumma (:budget-granted application)]
      [:Maksuehto "Z001"]
      [:Pitkaviite (:register-number application)]
      [:Tositepvm (format-date (:receipt-date payment))]
      [:Asiatarkastaja (:inspector-email payment)]
      [:Hyvaksyja (:acceptor-email payment)]
      [:Tositelaji (:document-type payment)]
      [:Toimittaja
       [:Y-tunnus (get-answer-value answers "business-id")]
       [:Nimi (:organization-name application)]
       [:Postiosoite (get-answer-value answers "address" "")]
       [:Paikkakunta (get-answer-value answers "city" "")]
       [:Maa (get-answer-value answers "country" "")]
       [:Iban-tili (get-answer-value answers "bank-iban")]
       [:Pankkiavain (get-answer-value answers "bank-bic")]
       [:Pankki-maa (get-answer-value answers "bank-country" "")]
       [:Kieli (:language application)]
       [:Valuutta (:currency payment)]]
      [:Postings
       [:Posting
        [:Summa (:budget-granted application)]
        [:LKP-tili (lkp/get-lkp-account (:answers application))]
        [:TaKp-tili (:takp-account application)]
        [:Toimintayksikko (get-in grant [:content :operational-unit])]
        [:Projekti (get-in grant [:content :project])]
        [:Toiminto  (get-in grant [:content :operation])]
        [:Kumppani (:partner payment)]]]]]))

(defn payment-to-xml [payment application grant]
  "Creates xml document (tags) of given payment of Valtionavustukset maksatus.
  Document should be valid document for VIA/Rondo."
  (sexp-as-element (payment-to-invoice payment application grant)))

(defn get-content [xml ks]
  (loop [content (list xml) xks ks]
    (if (empty? xks)
      content
      (let [k (first xks)
            v (some (fn [e] (when (= (:tag e) k) e)) content)]
        (when (not (nil? v))
          (recur (:content v) (rest xks)))))))

(defn read-response-xml [xml]
  {:register-number (first (get-content xml [:VA-invoice :Header :Pitkaviite]))
   :invoice-date (first (get-content xml [:VA-invoice :Header :Maksupvm]))})

(defn tags-to-str [tags]
  "Converts XML document of clojure.data.xml.elements tags to a string."
  (emit-str tags))

(defn write-xml! [tags file]
  "Writes XML document to a file.
  Document should be tags as clojure.data.xml.elements."
  (with-open [out-file (java.io.FileWriter. file)]
    (emit tags out-file)))

(defn read-xml [file]
  "Reads XML from file path and returns xml document of
  clojure.data.xml.elements."
  (with-open [input (java.io.FileInputStream. file)]
    (parse input)))
