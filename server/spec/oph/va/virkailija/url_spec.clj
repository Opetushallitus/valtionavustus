(ns oph.va.virkailija.url-spec
  (:require [speclj.core :refer :all]
            [oph.va.virkailija.url :as url]))

(describe "URL"
  (it "percent-encodes string component"
      (should= "a+%C3%A4" (url/encode "a ä")))

  (it "percent-encodes object component"
      (should= "%7B%3Aa+%22b%22%7D" (url/encode {:a "b"})))

  (it "percent-encodes map with one entry for query"
      (should= "foo=bar" (url/encode-map->query {:foo "bar"})))

  (it "percent-encodes map with many entries for query"
      (should= "colon=%3A&semicolon=%3B" (url/encode-map->query {:colon ":" "semicolon" ";"}))))
