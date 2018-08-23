(ns oph.va.admin-ui.payments.utils-test
  (:require [cljs.test :refer-macros [is are deftest testing use-fixtures]]
            [oph.va.admin-ui.payments.utils :as utils]
            [oph.va.admin-ui.utils :refer [format]]
            [cljs-time.core :as t]))

(deftest test-find-index-of
  (is (= 2 (utils/find-index-of [0 1 2 3 4] #(= 2 %))))
  (is (= 0 (utils/find-index-of [0 1 2 3 4] #(= 0 %))))
  (is (= -1 (utils/find-index-of [0 1 2 3 4] nil?)))
  (is (= -1 (utils/find-index-of [1 2 3 4] zero?))))

(deftest test-any-nil
  (is (not (utils/any-nil? {} [])))
  (is (not (utils/any-nil? {:hello "word"} [])))
  (is (not (utils/any-nil? {:hello nil} [])))
  (is (utils/any-nil? {nil nil} [nil]))
  (is (utils/any-nil? {} [:hello :world]))
  (is (utils/any-nil? {:hello "something"} [:hello :world]))
  (is (not (utils/any-nil? {:hello "something" :world "words"}
                           [:hello :world])))
  (is (utils/any-nil? {:hello "something" :world "words"}
                      [:hello :world :sep]))
  (is
   (utils/any-nil? {:hello "something" :world "words" :sep nil}
                   [:hello :world :sep]))
  (is (not (utils/any-nil?
            {:hello "something" :world "words" :sep "others"}
            [:hello :world :sep]))))

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

(deftest test-valid-email
  (is (utils/valid-email? "user@domain.com"))
  (is (utils/valid-email? "user.lastname@domain.com"))
  (is (utils/valid-email? "user@domain"))
  (is (not (utils/valid-email? "")))
  (is (not (utils/valid-email? nil)))
  (is (not (utils/valid-email? "@domain.com")))
  (is (not (utils/valid-email? "domain.com")))
  (is (not (utils/valid-email? "domain"))))

(deftest test-doc-matches
  (is (utils/doc-matches? {:document-id "id"} {:document-id "id"}))
  (is (utils/doc-matches?
        {:document-id "id"
         :presenter-email "some@email"
         :acceptor-email "some.other@email"}
        {:document-id "id"
         :acceptor-email "some.other@email"
         :presenter-email "some@email"}))
  (is (not
        (utils/doc-matches?
          {:document-id "id"
           :presenter-email "some@email"
           :acceptor-email "some.other@email"}
          {:document-id "id"
           :presenter-email "some@email"})))
  (is (not
        (utils/doc-matches?
          {:document-id "id"
           :presenter-email "some@email"
           :acceptor-email "some.other@email"}
          {:document-id "id"
           :acceptor-email "some.different@email"
           :presenter-email "some@email"})))
  (is (not (utils/doc-matches? {:document-id "doc-id"} nil)))
  (is (not (utils/doc-matches? nil {:document-id "doc-id"}))))

(deftest test-replace-doc
  (let [docs [{:document-id "id 1"
               :presenter-email "some1@email"
               :acceptor-email "some.other1@email"}
              {:document-id "id 2"
               :presenter-email "some2@email"
               :acceptor-email "some.other2@email"}
              {:document-id "id 3"
               :presenter-email "some3@email"
               :acceptor-email "some.other3@email"}]]
    (is
      (=
        (last
          (utils/replace-doc
            docs
            {:document-id "id 3"
             :presenter-email "some3@email"
             :acceptor-email "some.other3@email"}
            {:document-id "id 4"
             :presenter-email "some4@email"
             :acceptor-email "some.other4@email"}))
        {:document-id "id 4"
         :presenter-email "some4@email"
         :acceptor-email "some.other4@email"}))
    (is
      (=
        (second
          (utils/replace-doc
            docs
            {:document-id "id 2"
             :presenter-email "some2@email"
             :acceptor-email "some.other2@email"}
            {:document-id "id 5"
             :presenter-email "some5@email"
             :acceptor-email "some.other5@email"}))
        {:document-id "id 5"
         :presenter-email "some5@email"
         :acceptor-email "some.other5@email"}))
    (is (= (utils/replace-doc docs nil) docs))
    (is (nil? (utils/replace-doc nil nil)))))
