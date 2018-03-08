(ns ^:figwheel-no-load oph.va.applications-ui.dev
  (:require
    [oph.va.applications-ui.core :as core]
    [devtools.core :as devtools]))

(enable-console-print!)

(devtools/install!)

(core/init!)
