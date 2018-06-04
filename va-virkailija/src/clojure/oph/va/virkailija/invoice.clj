(ns oph.va.virkailija.invoice
  (:require [oph.va.virkailija.lkp-templates :as lkp]
            [clojure.data.xml :refer [emit emit-str parse
                                      sexp-as-element]]
            [clj-time.core :as t]
            [clj-time.coerce :as c]
            [clj-time.format :as f]))

(def organisations {"XA" 6600 "XB" 6604})

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
  ([batch]
   "Generating batch id of organisation, year and batch-number.
  Batch id is something like '660017006' where 6600 is organisation, 17 is
  year and 006 is order number or identification number, if you will.
  If some of values is missing, nil is being returned."
   (if (and (:created-at batch)
            (:document-type batch)
            (:batch-number batch))
     (get-batch-key
       (get organisations (:document-type batch))
       (mod (t/year (c/to-date-time (:created-at batch))) 100)
       (:batch-number batch))
     nil)))

(defn payment-to-invoice [{:keys [payment application grant batch]}]
  (let [answers (:answers application)]
    [:VA-invoice
     [:Header
      [:Maksuera (get-batch-key batch)]
      [:Laskunpaiva (.toString (:invoice-date batch))]
      [:Erapvm (.toString (:due-date batch))]
      [:Bruttosumma (:payment-sum payment)]
      [:Maksuehto "Z001"]
      [:Pitkaviite (:register-number application)]
      [:Tositepvm (.toString (:receipt-date batch))]
      [:Asiatarkastaja (:inspector-email batch)]
      [:Hyvaksyja (:acceptor-email batch)]
      [:Tositelaji (:document-type batch)]
      [:Maksutili (:transaction-account batch)]
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
       [:Valuutta (:currency batch)]]
      [:Postings
       [:Posting
        [:Summa (:payment-sum payment)]
        [:LKP-tili (lkp/get-lkp-account (:answers application))]
        [:TaKp-tili (:takp-account application)]
        [:Toimintayksikko (:operational-unit grant)]
        [:Projekti (:project grant)]
        [:Toiminto  (:operation grant)]
        [:Kumppani (:partner batch)]]]]]))

(defn payment-to-xml [data]
  "Creates xml document (tags) of given payment of Valtionavustukset maksatus.
  Document should be valid document for VIA/Rondo."
  (sexp-as-element (payment-to-invoice data)))

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
