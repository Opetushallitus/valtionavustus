(ns oph.va.admin-ui.components.tools)

(defn split-component [body]
  (if (map? (first body))
    {:props (first body)
     :children (rest body)}
    {:props {}
     :children body}))
