(ns va-payments-ui.runner
  (:require [doo.runner :refer-macros [doo-tests]]
            [va-payments-ui.utils-test]
            [va-payments-ui.grants-test]))

(doo-tests 'va-payments-ui.utils-test
           'va-payments-ui.grants-test)
