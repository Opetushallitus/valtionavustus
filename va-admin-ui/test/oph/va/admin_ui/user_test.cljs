(ns oph.va.admin-ui.user-test
  (:require [cljs.test :refer-macros [is deftest]]
            [oph.va.admin-ui.user :refer [is-admin?]]))

(deftest test-is-admin?
  (is (is-admin? {:privileges '("va-user" "va-admin")}))
  (is (is-admin? {:privileges '("va-admin" "va-user")}))
  (is (not (is-admin? {:privileges '("va-user")})))
  (is (not (is-admin? {:privileges '()})))
  (is (not (is-admin? {:privileges nil})))
  (is (not (is-admin? nil))))
