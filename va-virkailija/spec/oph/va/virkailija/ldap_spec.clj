(ns oph.va.virkailija.ldap-spec
  (:require
    [speclj.core :refer :all]
    [oph.va.virkailija.ldap :as ldap]))

(defn- search-input->ldap-filter-str [search-input]
  (str (ldap/search-input->ldap-filter search-input)))

(describe "LDAP search"
  (it "converts search input into LDAP filter"
      (should= (str "(&"
                    "(employeeNumber=*)"
                    "(|(mail=*pekka*)(givenName=*pekka*)(sn=*pekka*)(cn=*pekka*))"
                    "(|(mail=*matti*)(givenName=*matti*)(sn=*matti*)(cn=*matti*)))")
               (search-input->ldap-filter-str "pekka matti")))

  (it "removes duplicates from search input"
      (should= (str "(&"
                    "(employeeNumber=*)"
                    "(|(mail=*pekka*)(givenName=*pekka*)(sn=*pekka*)(cn=*pekka*)))")
               (search-input->ldap-filter-str "pekka pekka")))

  (it "escapes non-ascii characters"
      (let [escaped "t\\c3\\b6p\\c3\\b6h\\c3\\a4nt\\c3\\a4"]
        (should= (str "(&"
                      "(employeeNumber=*)"
                      "(|(mail=*" escaped "*)(givenName=*" escaped "*)(sn=*" escaped "*)(cn=*" escaped "*)))")
                 (search-input->ldap-filter-str "töpöhäntä"))))

  (it "escapes special characters"
      (let [escaped "p\\5cq\\29\\28employeeNumber=\\2a\\29\\28ol="]
        (should= (str "(&"
                      "(employeeNumber=*)"
                      "(|(mail=*" escaped "*)(givenName=*" escaped "*)(sn=*" escaped "*)(cn=*" escaped "*)))")
                 (search-input->ldap-filter-str "p\\q)(employeeNumber=*)(ol=")))))

(run-specs)
