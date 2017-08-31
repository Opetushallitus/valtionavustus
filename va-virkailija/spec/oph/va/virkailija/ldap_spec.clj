(ns oph.va.virkailija.ldap-spec
  (:require
    [speclj.core :refer :all]
    [oph.va.virkailija.ldap :as ldap]))

(describe "LDAP search"
  (it "converts search input into LDAP filter"
      (should= (str "(&"
                    "(employeeNumber=*)"
                    "(|(mail=*pekka)(mail=pekka*)(givenName=*pekka)(givenName=pekka*)(sn=*pekka)(sn=pekka*)(cn=*pekka)(cn=pekka*))"
                    "(|(mail=*töpöhäntä)(mail=töpöhäntä*)(givenName=*töpöhäntä)(givenName=töpöhäntä*)(sn=*töpöhäntä)(sn=töpöhäntä*)(cn=*töpöhäntä)(cn=töpöhäntä*)))")
               (ldap/search-input->ldap-filter "pekka töpöhäntä")))

  (it "removes duplicates from search input"
      (should= (str "(&"
                    "(employeeNumber=*)"
                    "(|(mail=*pekka)(mail=pekka*)(givenName=*pekka)(givenName=pekka*)(sn=*pekka)(sn=pekka*)(cn=*pekka)(cn=pekka*)))")
               (ldap/search-input->ldap-filter "pekka pekka"))))

(run-specs)
