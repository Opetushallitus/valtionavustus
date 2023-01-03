(ns oph.va.hakija.attachment-validator-spec
  (:use [clojure.tools.trace])
  (:require [speclj.core
             :refer [describe tags around-all it should should= run-specs]]
            [oph.va.hakija.attachment-validator :as validator]
            [oph.soresu.common.config :refer [config]]))

(def allowed-mime-types (-> config :server :attachment-mime-types))
(def test-pdf (clojure.java.io/resource "dummy.pdf"))
(def test-svg (clojure.java.io/resource "dummy.svg"))

(describe
  "Attachment validation"

  (it "accepts PDF files"
      (should=
        {:provided-content-type "application/asdf"
         :detected-content-type "application/pdf"
         :allowed? true}
        (validator/validate-file-content-type test-pdf "application/asdf")))

  (it "declines SVG files"
      (should=
        {:provided-content-type "application/pdf"
         :detected-content-type "image/svg+xml"
         :allowed? false
         :allowed-content-types allowed-mime-types}
        (validator/validate-file-content-type test-svg "application/pdf")))

  (it "keeps pdf in the file name for application/pdf"
      (should=
        "document.pdf"
        (validator/file-name-according-to-content-type "document.pdf" "application/pdf")))

  (it "keeps pdf in the file name for application/pdf"
      (should=
        "document.txt.pdf"
        (validator/file-name-according-to-content-type "document.txt" "application/pdf"))))

(run-specs)
