(ns va-payments-ui.router)

(defn- split-param [param]
  (let [[k v] (.split param "=")]
    {(keyword k) v}))

(defn- split-params [params]
  (map split-param params))

(defn- merge-params [params]
  (reduce conj params))

(defn get-current-path []
  (-> js/window
      (.-location)
      (.-pathname)))

(defn get-current-query []
  (-> js/window
      (.-location)
      (.-search)
      (.replace "?" "")))

(defn add-to-history! [path]
  (-> js/window
      (.-history)
      (.pushState "" "" path)))

(defn get-param [query param]
  (when (not (empty? query))
    (-> query
        (.split "&")
        (js->clj)
        (split-params)
        (merge-params)
        (get param))))

(defn get-current-param [param]
  (get-param (get-current-query) param))

