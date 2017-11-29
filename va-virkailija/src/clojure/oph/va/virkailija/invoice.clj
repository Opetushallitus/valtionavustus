(ns oph.va.virkailija.invoice
  (:require [clojure.data.xml :refer [emit emit-str parse
                                      sexp-as-element]]
            [clj-time.core :as t]
            [clj-time.coerce :as c]))

(defn- get-answer-value [answers key]
  (:value
   (first
    (filter #(= (:key %) key) answers))))

(defn- payment-to-invoice [payment application]
  [:VA-invoice
   [:Header
    [:Maksuera
     (format "%s%d%d"
             (:organisation payment)
             (:installment-number payment)
             (t/year (c/from-sql-time (:created-at payment))))]
    [:Laskunpaiva (:invoice-date payment)]
    [:Erapvm (:due-date payment)]
    [:Bruttosumma (:amount payment)]
    [:Maksuehto "Z001"]
    [:Pitkaviite (:long-ref payment)]
    [:Tositepvm (:receipt-date payment)]
    [:Asiatarkastaja (:inspector-email payment)]
    [:Hyvaksyja (:acceptor-email payment)]
    [:Tositelaji (:document-type payment)]
    [:Toimittaja
     [:Y-tunnus (get-answer-value (:answers application) "business-id")]
     [:Nimi (:organization-name application)]
     [:Postiosoite
      (or (get-answer-value (:answers application) "address") "")]
     [:Paikkakunta
      (or (get-answer-value (:answers application) "city") "")]
     [:Maa
      (or (get-answer-value (:answers application) "country") "")]
     [:Iban-tili
      (get-answer-value (:answers application) "bank-iban")]
     [:Pankkiavain
      (get-answer-value (:answers application) "bank-bic")]
     [:Pankki-maa
      (or (get-answer-value (:answers application) "bank-country") "")]
     [:Kieli (:language application)]
     [:Valuutta (:currency payment)]]
    [:Postings
     [:Posting
      [:Summa (:amount payment)]
      [:LKP-tili (:lkp-account payment)]
      [:TaKp-tili (:takp-account payment)]
      [:Toimintayksikko (:operational-unit payment)]
      [:Projekti (:project payment)]
      [:Toiminto (:operation payment)]
      [:Kumppani (:partner payment)]]]]])

(defn payment-to-xml [payment application]
  "Creates xml document (tags) of given payment of Valtionavustukset maksatus.
  Document should be valid document for VIA/Rondo."
  (sexp-as-element (payment-to-invoice payment application)))

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
