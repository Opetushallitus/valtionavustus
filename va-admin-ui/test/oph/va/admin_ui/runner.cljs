(ns oph.va.admin-ui.runner
  (:require [doo.runner :refer-macros [doo-tests]]
            [oph.va.admin-ui.utils-test]
            [oph.va.admin-ui.grants-test]
            [oph.va.admin-ui.user-test]))

(doo-tests 'oph.va.admin-ui.utils-test
           'oph.va.admin-ui.grants-test
           'oph.va.admin-ui.user-test)
