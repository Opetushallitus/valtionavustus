(ns oph.va.virkailija.export-spec
  (:require
    [speclj.core :refer :all]
    [oph.va.virkailija.export :as export]))

(describe "Excel export"
  (it "allows nil IBAN in form submission input"
      (let [paatos-data (export/add-paatos-data nil {:answers []})]
        (should-be-nil (:iban paatos-data))))

  (it "adds LKP-TILI to päätösdata output"
      (let [paatos-data (export/add-paatos-data nil {:answers [{:key "radioButton-0", :value "yliopisto", :fieldType "radioButton"}]})]
        (should= 82930000 (:lkp paatos-data))))

  (it "removes dots from talousarviotili to be used as takp"
      (let [paatos-data (export/add-paatos-data nil {:arvio {:talousarviotili "1.2.3.4"}})]
        (should= "1234" (:takp paatos-data)))))

(run-specs)
