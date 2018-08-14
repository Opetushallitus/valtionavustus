(ns oph.va.admin-ui.components.tools
  (:require-macros [cljs.core.async.macros :refer [go go-loop]])
  (:require [cljs.core.async :refer [<! put! close! chan]]
            [oph.va.admin-ui.dialogs :as dialogs]))

(defn split-component [body]
  (if (map? (first body))
    {:props (first body)
     :children (rest body)}
    {:props {}
     :children body}))

(defn conn-with-err-dialog! [dialog-msg error-msg f & args]
  (let [c (chan)]
    (go
      (let [dialog-chan (dialogs/show-loading-dialog! dialog-msg 3)]
        (put! dialog-chan 1)
        (let [result (<! (apply f args))]
          (put! dialog-chan 2)
          (if (:success result)
            (>! c (or (:body result) ""))
            (dialogs/show-error-message!
              error-msg
              (select-keys result [:status :error-text]))))
        (put! dialog-chan 3)
        (close! dialog-chan)
        (close! c)))
    c))
