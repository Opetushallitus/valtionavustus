(ns oph.va.virkailija.utils-spec
  (:require [speclj.core
             :refer [describe it should= should should-not should-throw tags]]
            [oph.va.virkailija.utils :as utils]))

(describe "Key contains"
          (it "key contains"
              (should (#'utils/key-contains? :some-key "some")))
          (it "key does not contain"
              (should-not (#'utils/key-contains? :some-key "no")))
          (it "key does contain empty value"
              (should (#'utils/key-contains? :some-key "")))
          (it "throws on nil key"
              (should-throw (#'utils/key-contains? nil "key")))
          (it "should throw on nil value"
              (should-throw (#'utils/key-contains? :some-key nil))))

(describe "Replace in key"
          (it "replaces substring on a key"
              (should= (#'utils/replace-in-key :some_key "_" "-") :some-key))
          (it "does not touch key if substring is not found"
              (should= (#'utils/replace-in-key :some-key "_" "-") :some-key))
          (it "should throw on nil key"
              (should-throw (#'utils/replace-in-key nil "_" "-")))
          (it "should throw on nil value"
              (should-throw (#'utils/replace-in-key :some-key nil "-")))
          (it "should throw on nil value"
              (should-throw (#'utils/replace-in-key :some-key "_" nil))))

(def with-underscore
  {:some_value "value 1" :some_other_value "value 2" :value "value3"})

(def with-dashes
  {:some-value "value 1" :some-other-value "value 2" :value "value3"})

(describe "Convert to dash keys"
          (it "converts underscore keys to dash keys"
              (should= (utils/convert-to-dash-keys with-underscore)
                       with-dashes)))

(describe "Conversion does not alter original"
          (it "should return the same underscore keys on back and forth conversion"
              (should= (utils/convert-to-underscore-keys
                         (utils/convert-to-dash-keys with-underscore))
                       with-underscore))
          (it "should return the same dash keys on back and forth conversion"
              (should= (utils/convert-to-dash-keys
                         (utils/convert-to-underscore-keys with-dashes))
                       with-dashes))
          (it "should keep keys after double dash conversions"
              (should= (utils/convert-to-dash-keys
                         (utils/convert-to-dash-keys with-underscore))
                       with-dashes))
          (it "should keep keys after double underscore conversions"
              (should= (utils/convert-to-underscore-keys
                         (utils/convert-to-underscore-keys with-dashes))
                       with-underscore)))

(describe "Conversion of invalid values"
          (it "should return empty on empty map with underscore"
              (should= (utils/convert-to-underscore-keys {}) {}))
          (it "should return empty on empty map with dashes"
              (should= (utils/convert-to-dash-keys {}) {}))
          (it "should return nil on nil underscore map"
              (should= (utils/convert-to-underscore-keys nil) nil))
          (it "should return nil on nil dash map"
              (should= (utils/convert-to-dash-keys nil) nil)))

(describe "Either"
          (tags :utils :either)
          (it "should return true when int is found in vector"
              (should (utils/either? 2 [1 2 3])))
          (it "should return true when int is found in list"
              (should (utils/either? 2 '(1 2 3))))
          (it "should return true when key is found in set"
              (should (utils/either? :some-key #{:other-key :some-key})))
          (it "should return false when int is not found in vector"
              (should-not (utils/either? 2 [3 4 3])))
          (it "should return false when int is not found in list"
              (should-not (utils/either? 2 '(1 3 0))))
          (it "should return false when key is not found in set"
              (should-not (utils/either? :not-found #{:found :other})))
          (it "should return false when searching for nil"
              (should-not (utils/either? nil [3 4 3])))
          (it "should return false when searching something in nil"
              (should-not (utils/either? 2 nil))))
