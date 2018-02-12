(ns ^:figwheel-no-load oph.va.admin-ui.dev
  (:require
    [oph.va.admin-ui.core :as core]
    [devtools.core :as devtools]))

(enable-console-print!)

(devtools/install!)

(core/init!)
