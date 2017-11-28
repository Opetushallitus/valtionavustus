(ns ^:figwheel-no-load va-payments-ui.dev
  (:require
    [va-payments-ui.core :as core]
    [devtools.core :as devtools]))

(enable-console-print!)

(devtools/install!)

(core/init!)
