(ns oph.va.virkailija.lkp-templates-spec
  (:require [speclj.core :refer [describe it should= should-throw]]
            [oph.va.virkailija.lkp-templates :refer [get-lkp-account]]))

(def templates
  '({:key "some-unique-key"
     :accounts {"key-number-1" 1234567
                "key-number-2" 2345678
                "key-number-3" 3456789}}
    {:key "some-other-unique-key"
     :accounts {"key-number-3" 2234567
                "key-number-4" 2345678
                "key-number-5" 2456789}}))

(describe "Get LKP account"
          (it "gets valid LKP account (first)"
              (should= 1234567
                       (get-lkp-account templates
                                        [{:key "some-unique-key"
                                          :value "key-number-1"}
                                         {:key "some-other-invalid-key"
                                          :value "key-number-0"}])))
          (it "gets first valid LKP account with multiple valid ones"
              (should= 1234567
                       (get-lkp-account (vec templates)
                                        [{:key "some-unique-key"
                                          :value "key-number-1"}
                                         {:key "some-other-unique-key"
                                          :value "key-number-3"}])))
          (it "gets valid LKP account (last)"
              (should= 2456789
                       (get-lkp-account templates
                                        [{:key "some-other-unique-key"
                                          :value "key-number-5"}])))
          (it "returns nil when a key is valid but account is not found"
              (should= nil
                       (get-lkp-account templates
                                        [{:key "some-other-invalid-key"
                                          :value "key-number-5"}
                                         {:key "some-unique-key"
                                          :value "key-number-4"}])))
          (it "returns nil when key is invalid but account is found"
              (should= nil
                       (get-lkp-account templates
                                        [{:key "some-other-invalid-key"
                                          :value "key-number-2"}
                                         {:key "some-invalid-key"
                                          :value "key-number-1"}])))
          (it "returns nil when both key and value are invalid"
              (should= nil
                       (get-lkp-account templates
                                        [{:key "some-other-invalid-key"
                                          :value "key-number-6"}
                                         {:key "some-invalid-key"
                                          :value "key-number-0"}])))
          (it "returns nil when templates is nil"
              (should= nil
                       (get-lkp-account nil
                                        [{:key "some-unique-key"
                                          :value "key-number-1"}])))
          (it "returns nil when value is nil"
              (should= nil (get-lkp-account templates nil))))
