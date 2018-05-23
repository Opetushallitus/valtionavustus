(ns oph.va.admin-ui.payments.utils-test
  (:require [cljs.test :refer-macros [is are deftest testing use-fixtures]]
            [oph.va.admin-ui.payments.utils :as utils]
            [oph.va.admin-ui.utils :refer [format]]
            [cljs-time.core :as t]))

(deftest test-any-nil
  (is (not (utils/any-nil? {} [])))
  (is (not (utils/any-nil? {:hello "word"} [])))
  (is (not (utils/any-nil? {:hello nil} [])))
  (is (utils/any-nil? {nil nil} [nil]))
  (is (utils/any-nil? {} [:hello :world]))
  (is (utils/any-nil? {:hello "something"} [:hello :world]))
  (is (not (utils/any-nil? {:hello "something" :world "words"} [:hello :world])))
  (is (utils/any-nil? {:hello "something" :world "words"} [:hello :world :sep]))
  (is
   (utils/any-nil? {:hello "something" :world "words" :sep nil} [:hello :world :sep]))
  (is (not (utils/any-nil?
            {:hello "something" :world "words" :sep "others"} [:hello :world :sep]))))

(defn- now-str []
  (let [now (Date.)]
    (format "%d-%d-%d"
            (.getYear now)
            (.getMonth now)
            (.getDay now))))

(deftest test-is-today
  (is (utils/is-today? (t/today)))
  (is (utils/is-today? (str (t/today))))
  (is (utils/is-today? (t/today-at 0 0 0)))
  (is (utils/is-today? (t/today-at 23 59 59))))
