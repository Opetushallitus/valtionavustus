(ns oph.va.applications-ui.runner
  (:require [doo.runner :refer-macros [doo-tests]]
            [oph.va.applications-ui.core-test]))

(doo-tests 'oph.va.applications-ui.core-test)
