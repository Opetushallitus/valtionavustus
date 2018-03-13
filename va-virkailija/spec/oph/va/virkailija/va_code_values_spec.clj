(ns oph.va.virkailija.va-code-values-spec
  (:require [speclj.core
             :refer [describe it should]]
            [oph.va.virkailija.va-code-values-data :refer [has-privilege?]]))

(describe "Checking privileges"
          (it "has privilege"
              (should (has-privilege?
                        {:privileges '("va-user" "va-admin")}
                        "va-user")))
          (it "has privilege"
              (should (has-privilege?
                        {:privileges '("va-user" "va-admin")}
                        "va-admin")))
          (it "does not have a privilege"
              (should (not (has-privilege?
                             {:privileges '("va-user")}
                             "va-admin"))))
          (it "handles empty privileges"
              (should (not (has-privilege?
                             {:privileges '()}
                             "va-admin"))))
          (it "handles empty identity"
              (should (not (has-privilege? {} "va-admin"))))
          (it "handles nil identity"
              (should (not (has-privilege? nil "va-admin")))))
