(ns oph.va.virkailija.export-spec
  (:require
    [speclj.core :refer :all]
    [oph.va.virkailija.export :as export]))

(describe "Excel export"
  (it "allows nil IBAN in form submission input"
      (let [paatos-data (export/add-paatos-data nil {:answers []})]
        (should-be-nil (:iban paatos-data)))))

(run-specs)
