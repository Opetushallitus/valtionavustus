(ns oph.va.admin-ui.runner
  (:require [doo.runner :refer-macros [doo-tests]]
            [oph.va.admin-ui.utils-test]
            [oph.va.admin-ui.user-test]
            [oph.va.admin-ui.payments.payments-test]
            [oph.va.admin-ui.payments.utils-test]))

(doo-tests 'oph.va.admin-ui.utils-test
           'oph.va.admin-ui.user-test
           'oph.va.admin-ui.payments.payments-test
           'oph.va.admin-ui.payments.utils-test)
